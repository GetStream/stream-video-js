import { TFLite } from '../tflite';
import {
  compileShader,
  createPipelineStageProgram,
  createTexture,
  glsl,
} from '../helpers/webglHelper';
import { SegmentationParams } from '../segmentation';

export function buildSoftmaxStage(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  positionBuffer: WebGLBuffer,
  texCoordBuffer: WebGLBuffer,
  tflite: TFLite,
  outputTexture: WebGLTexture,
  segmentationConfig: SegmentationParams,
) {
  const fragmentShaderSource = glsl`#version 300 es

    precision highp float;

    uniform sampler2D u_inputSegmentation;
    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
      vec2 segmentation = texture(u_inputSegmentation, v_texCoord).rg;
      float shift = max(segmentation.r, segmentation.g);
      float backgroundExp = exp(segmentation.r - shift);
      float personExp = exp(segmentation.g - shift);
      outColor = vec4(vec3(0.0), personExp / (backgroundExp + personExp));
    }
  `;

  // TFLite memory will be accessed as float32
  const tfliteOutputMemoryOffset = tflite._getOutputMemoryOffset() / 4;
  const { width: segmentationWidth, height: segmentationHeight } =
    segmentationConfig;

  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );
  const program = createPipelineStageProgram(
    gl,
    vertexShader,
    fragmentShader,
    positionBuffer,
    texCoordBuffer,
  );
  const inputLocation = gl.getUniformLocation(program, 'u_inputSegmentation');
  const inputTexture = createTexture(
    gl,
    gl.RG32F,
    segmentationWidth,
    segmentationHeight,
  );

  const frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    outputTexture,
    0,
  );

  gl.useProgram(program);
  gl.uniform1i(inputLocation, 1);

  function render() {
    gl.viewport(0, 0, segmentationWidth, segmentationHeight);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      segmentationWidth,
      segmentationHeight,
      gl.RG,
      gl.FLOAT,
      tflite.HEAPF32,
      tfliteOutputMemoryOffset,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function cleanUp() {
    gl.deleteFramebuffer(frameBuffer);
    gl.deleteTexture(inputTexture);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
  }

  return { render, cleanUp };
}
