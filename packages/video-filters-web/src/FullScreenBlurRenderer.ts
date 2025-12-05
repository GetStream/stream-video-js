/**
 * Simple WebGL renderer for full-screen Gaussian blur.
 * Uses a two-pass separable Gaussian blur (horizontal then vertical).
 * Optimized for moderation use cases by blurring at reduced resolution (15% scale)
 * and upscaling back to full resolution for output.
 */
export class FullScreenBlurRenderer {
  readonly canvas: OffscreenCanvas;
  readonly gl: WebGL2RenderingContext;

  readonly blurProgramHandle: WebGLProgram;
  readonly blurLocations: {
    positionLocation: number;
    texCoordLocation: number;
    imageLocation: WebGLUniformLocation | null;
    texelSizeLocation: WebGLUniformLocation | null;
    directionLocation: WebGLUniformLocation | null;
    weightsLocation: WebGLUniformLocation | null;
  };

  readonly passthroughProgramHandle: WebGLProgram;
  readonly passthroughLocations: {
    positionLocation: number;
    texCoordLocation: number;
    imageLocation: WebGLUniformLocation | null;
  };

  readonly positionBuffer: WebGLBuffer | null;
  readonly texCoordBuffer: WebGLBuffer | null;

  readonly pingTexture: WebGLTexture | null;
  readonly pongTexture: WebGLTexture | null;
  readonly pingFbo: WebGLFramebuffer | null;
  readonly pongFbo: WebGLFramebuffer | null;

  private inputTexture: WebGLTexture | null = null;
  private isRunning = false;

  private targetWidth = 0;
  private targetHeight = 0;

  private weightCache = new Map<number, Float32Array>();

  constructor(canvas: OffscreenCanvas) {
    this.canvas = canvas;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      desynchronized: true,
    });

    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    const vertexShaderSource = `#version 300 es
      precision highp float;
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
          v_texCoord = a_texCoord;
          gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      uniform vec2 u_texelSize;
      uniform vec2 u_direction;
      uniform float u_weights[25];
      void main() {
          vec4 color = vec4(0.0);
          for (int i = -12; i <= 12; i++) {
              float w = u_weights[i + 12];
              if (w == 0.0) continue;
              vec2 offset = float(i) * u_direction * u_texelSize;
              color += w * texture(u_image, v_texCoord + offset);
          }
          outColor = color;
      }
    `;

    this.blurProgramHandle = this.createAndLinkProgram(
      vertexShaderSource,
      fragmentShaderSource,
    );

    const passthroughFragmentShaderSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform sampler2D u_image;
      void main() {
          outColor = texture(u_image, v_texCoord);
      }
    `;

    this.passthroughProgramHandle = this.createAndLinkProgram(
      vertexShaderSource,
      passthroughFragmentShaderSource,
    );

    const blurProgram = this.blurProgramHandle;
    const passthroughProgram = this.passthroughProgramHandle;

    this.blurLocations = {
      positionLocation: gl.getAttribLocation(blurProgram, 'a_position'),
      texCoordLocation: gl.getAttribLocation(blurProgram, 'a_texCoord'),
      imageLocation: gl.getUniformLocation(blurProgram, 'u_image'),
      texelSizeLocation: gl.getUniformLocation(blurProgram, 'u_texelSize'),
      directionLocation: gl.getUniformLocation(blurProgram, 'u_direction'),
      weightsLocation: gl.getUniformLocation(blurProgram, 'u_weights'),
    };

    this.passthroughLocations = {
      positionLocation: gl.getAttribLocation(passthroughProgram, 'a_position'),
      texCoordLocation: gl.getAttribLocation(passthroughProgram, 'a_texCoord'),
      imageLocation: gl.getUniformLocation(passthroughProgram, 'u_image'),
    };

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );

    const createTexture2D = () => {
      const tex = gl.createTexture();
      if (!tex) throw new Error('Failed to create texture');
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return tex;
    };

    const createFramebufferForTexture = (tex: WebGLTexture) => {
      const fb = gl.createFramebuffer();
      if (!fb) throw new Error('Failed to create framebuffer');
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return fb;
    };

    this.pingTexture = createTexture2D();
    this.pongTexture = createTexture2D();
    this.pingFbo = createFramebufferForTexture(this.pingTexture);
    this.pongFbo = createFramebufferForTexture(this.pongTexture);

    this.inputTexture = createTexture2D();

    gl.useProgram(blurProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.blurLocations.positionLocation);
    gl.vertexAttribPointer(
      this.blurLocations.positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.blurLocations.texCoordLocation);
    gl.vertexAttribPointer(
      this.blurLocations.texCoordLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    if (this.blurLocations.imageLocation) {
      gl.uniform1i(this.blurLocations.imageLocation, 0);
    }

    this.isRunning = true;
  }

  private createAndLinkProgram(
    vsSource: string,
    fsSource: string,
  ): WebGLProgram {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);

    const prog = gl.createProgram();
    if (!prog) throw new Error('Failed to create program');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Shader link failed: ' + gl.getProgramInfoLog(prog));
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return prog;
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile failed: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  private getGaussianWeights(radius: number): Float32Array {
    const r = Math.max(0, Math.min(radius | 0, 12));

    const cached = this.weightCache.get(r);
    if (cached) return cached;

    const weights = new Float32Array(25);

    if (r === 0) {
      weights[12] = 1.0;
      this.weightCache.set(r, weights);
      return weights;
    }

    const sigma = r * 0.6;
    let sum = 0;

    for (let i = -r; i <= r; i++) {
      const w = Math.exp(-(i * i) / (2 * sigma * sigma));
      weights[i + 12] = w;
      sum += w;
    }

    for (let i = -r; i <= r; i++) {
      weights[i + 12] /= sum;
    }

    this.weightCache.set(r, weights);
    return weights;
  }

  public render(frame: VideoFrame, radius: number): void {
    if (!this.isRunning) return;

    const gl = this.gl;

    const width = frame.displayWidth;
    const height = frame.displayHeight;

    if (!width || !height) return;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const scale = 0.15;
    const scaledWidth = Math.max(1, Math.floor(width * scale));
    const scaledHeight = Math.max(1, Math.floor(height * scale));

    if (
      scaledWidth !== this.targetWidth ||
      scaledHeight !== this.targetHeight
    ) {
      this.targetWidth = scaledWidth;
      this.targetHeight = scaledHeight;

      gl.bindTexture(gl.TEXTURE_2D, this.pingTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        scaledWidth,
        scaledHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );

      gl.bindTexture(gl.TEXTURE_2D, this.pongTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        scaledWidth,
        scaledHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );

      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);

    gl.useProgram(this.blurProgramHandle);

    if (this.blurLocations.texelSizeLocation) {
      gl.uniform2f(
        this.blurLocations.texelSizeLocation,
        1.0 / scaledWidth,
        1.0 / scaledHeight,
      );
    }

    const weights = this.getGaussianWeights(radius);
    if (this.blurLocations.weightsLocation) {
      gl.uniform1fv(this.blurLocations.weightsLocation, weights);
    }

    gl.viewport(0, 0, scaledWidth, scaledHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingFbo);
    gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
    if (this.blurLocations.directionLocation) {
      gl.uniform2f(this.blurLocations.directionLocation, 1.0, 0.0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pongFbo);
    gl.bindTexture(gl.TEXTURE_2D, this.pingTexture);
    if (this.blurLocations.directionLocation) {
      gl.uniform2f(this.blurLocations.directionLocation, 0.0, 1.0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.passthroughProgramHandle);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.passthroughLocations.positionLocation);
    gl.vertexAttribPointer(
      this.passthroughLocations.positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.passthroughLocations.texCoordLocation);
    gl.vertexAttribPointer(
      this.passthroughLocations.texCoordLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    gl.bindTexture(gl.TEXTURE_2D, this.pongTexture);
    if (this.passthroughLocations.imageLocation) {
      gl.uniform1i(this.passthroughLocations.imageLocation, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public close(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    const gl = this.gl;

    if (this.pingFbo) gl.deleteFramebuffer(this.pingFbo);
    if (this.pongFbo) gl.deleteFramebuffer(this.pongFbo);
    if (this.pingTexture) gl.deleteTexture(this.pingTexture);
    if (this.pongTexture) gl.deleteTexture(this.pongTexture);
    if (this.inputTexture) gl.deleteTexture(this.inputTexture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);

    gl.deleteProgram(this.blurProgramHandle);
    gl.deleteProgram(this.passthroughProgramHandle);
  }
}
