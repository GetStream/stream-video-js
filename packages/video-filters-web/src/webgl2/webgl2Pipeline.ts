import { TFLite } from '../tflite';
import { compileShader, createTexture, glsl } from '../helpers/webglHelper';
import {
  BackgroundBlurStage,
  buildBackgroundBlurStage,
} from './backgroundBlurStage';
import {
  BackgroundImageStage,
  buildBackgroundImageStage,
} from './backgroundImageStage';
import { buildJointBilateralFilterStage } from './jointBilateralFilterStage';
import { buildResizingStage } from './resizingStage';
import { buildSoftmaxStage } from './softmaxStage';
import { BackgroundBlurLevel, BackgroundFilter } from '../createRenderer';
import { SegmentationParams } from '../segmentation';

export function buildWebGL2Pipeline(
  videoSource: HTMLVideoElement,
  backgroundImage: HTMLImageElement | undefined,
  blurLevel: BackgroundBlurLevel | undefined,
  backgroundFilter: BackgroundFilter,
  canvas: HTMLCanvasElement,
  tflite: TFLite,
  segmentationConfig: SegmentationParams,
) {
  const gl = canvas.getContext('webgl2')!;
  if (!gl) throw new Error('WebGL2 is not supported');
  if (gl.isContextLost()) throw new Error('WebGL2 context was lost');

  const { width: frameWidth, height: frameHeight } = videoSource;
  const { width: segmentationWidth, height: segmentationHeight } =
    segmentationConfig;

  const vertexShaderSource = glsl`#version 300 es

    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);

  const positionBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW,
  );

  const texCoordBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW,
  );

  // We don't use texStorage2D here because texImage2D seems faster
  // to upload video texture than texSubImage2D even though the latter
  // is supposed to be the recommended way:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#use_texstorage_to_create_textures
  const inputFrameTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // TODO Rename segmentation and person mask to be more specific
  const segmentationTexture = createTexture(
    gl,
    gl.RGBA8,
    segmentationWidth,
    segmentationHeight,
  )!;
  const personMaskTexture = createTexture(
    gl,
    gl.RGBA8,
    frameWidth,
    frameHeight,
  )!;

  const resizingStage = buildResizingStage(
    gl,
    vertexShader,
    positionBuffer,
    texCoordBuffer,
    tflite,
    segmentationConfig,
  );
  const loadSegmentationStage = buildSoftmaxStage(
    gl,
    vertexShader,
    positionBuffer,
    texCoordBuffer,
    tflite,
    segmentationTexture,
    segmentationConfig,
  );

  const jointBilateralFilterStage = buildJointBilateralFilterStage(
    gl,
    vertexShader,
    positionBuffer,
    texCoordBuffer,
    segmentationTexture,
    personMaskTexture,
    canvas,
    segmentationConfig,
  );
  const backgroundStage =
    backgroundFilter === 'blur'
      ? buildBackgroundBlurStage(
          gl,
          vertexShader,
          positionBuffer,
          texCoordBuffer,
          personMaskTexture,
          canvas,
          blurLevel || 'high',
        )
      : buildBackgroundImageStage(
          gl,
          positionBuffer,
          texCoordBuffer,
          personMaskTexture,
          backgroundImage,
          canvas,
        );

  function render() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);

    // texImage2D seems faster than texSubImage2D to upload
    // video texture
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      videoSource,
    );

    gl.bindVertexArray(vertexArray);

    resizingStage.render();

    tflite._runInference();

    loadSegmentationStage.render();
    jointBilateralFilterStage.render();
    backgroundStage.render();
  }

  function updatePostProcessingConfig() {
    jointBilateralFilterStage.updateSigmaSpace(1);
    jointBilateralFilterStage.updateSigmaColor(0.1);

    if (backgroundFilter === 'image') {
      const backgroundImageStage = backgroundStage as BackgroundImageStage;
      backgroundImageStage.updateCoverage([0.5, 0.75]);
      backgroundImageStage.updateLightWrapping(0.3);
      backgroundImageStage.updateBlendMode('screen');
    } else if (backgroundFilter === 'blur') {
      const backgroundBlurStage = backgroundStage as BackgroundBlurStage;
      backgroundBlurStage.updateCoverage([0.5, 0.75]);
    } else {
      // TODO Handle no background in a separate pipeline path
      const backgroundImageStage = backgroundStage as BackgroundImageStage;
      backgroundImageStage.updateCoverage([0, 0.9999]);
      backgroundImageStage.updateLightWrapping(0);
    }
  }

  function cleanUp() {
    backgroundStage.cleanUp();
    jointBilateralFilterStage.cleanUp();
    loadSegmentationStage.cleanUp();
    resizingStage.cleanUp();

    gl.deleteTexture(personMaskTexture);
    gl.deleteTexture(segmentationTexture);
    gl.deleteTexture(inputFrameTexture);
    gl.deleteBuffer(texCoordBuffer);
    gl.deleteBuffer(positionBuffer);
    gl.deleteVertexArray(vertexArray);
    gl.deleteShader(vertexShader);
  }

  return { render, updatePostProcessingConfig, cleanUp };
}
