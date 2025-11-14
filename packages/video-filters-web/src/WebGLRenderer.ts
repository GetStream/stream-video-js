import { BackgroundSource } from './types';

type ImageInfo = {
  type: 'image';
  texture: WebGLTexture;
  width: number;
  height: number;
  url: string;
};

type VideoInfo = {
  type: 'video';
  texture: WebGLTexture;
  url: string;
  media: ReadableStream;
  canvas: OffscreenCanvas;
};

type ColorInfo = {
  type: 'color';
  texture: WebGLTexture;
  color: readonly [number, number, number, number];
};

type BackgroundRenderInfo = ImageInfo | VideoInfo | ColorInfo;

export class WebGLRenderer {
  readonly canvas: OffscreenCanvas;
  readonly gl: WebGL2RenderingContext;

  readonly stateUpdateProgram: WebGLProgram;
  readonly maskRefineProgram: WebGLProgram;
  readonly blurProgram: WebGLProgram;
  readonly blendProgram: WebGLProgram;

  readonly stateUpdateLocations: {
    position: number;
    texCoord: number;
    categoryTexture: WebGLUniformLocation | null;
    confidenceTexture: WebGLUniformLocation | null;
    prevStateTexture: WebGLUniformLocation | null;
    smoothingFactor: WebGLUniformLocation | null;
    smoothstepMin: WebGLUniformLocation | null;
    smoothstepMax: WebGLUniformLocation | null;
    selfieModel: WebGLUniformLocation | null;
  };
  readonly maskRefineLocations: {
    position: number;
    texCoord: number;
    maskTexture: WebGLUniformLocation | null;
    frameTexture: WebGLUniformLocation | null;
    texelSize: WebGLUniformLocation | null;
    sigmaSpatial: WebGLUniformLocation | null;
    sigmaRange: WebGLUniformLocation | null;
  };
  readonly blurLocations: {
    position: number;
    texCoord: number;
    image: WebGLUniformLocation | null;
    texelSize: WebGLUniformLocation | null;
    sigma: WebGLUniformLocation | null;
    radiusScale: WebGLUniformLocation | null;
    personMask: WebGLUniformLocation | null;
    direction: WebGLUniformLocation | null;
  };
  readonly blendLocations: {
    position: number;
    texCoord: number;
    frameTexture: WebGLUniformLocation | null;
    currentStateTexture: WebGLUniformLocation | null;
    backgroundTexture: WebGLUniformLocation | null;
    bgImageDimensions: WebGLUniformLocation | null;
    canvasDimensions: WebGLUniformLocation | null;
    borderSmooth: WebGLUniformLocation | null;
    bgBlur: WebGLUniformLocation | null;
    bgBlurRadius: WebGLUniformLocation | null;
    enabled: WebGLUniformLocation | null;
  };
  readonly positionBuffer: WebGLBuffer | null;
  readonly texCoordBuffer: WebGLBuffer | null;
  readonly storedStateTextures: (WebGLTexture | null)[];
  readonly fbo: WebGLFramebuffer | null;
  readonly refineFbo: WebGLFramebuffer | null;
  readonly refinedMaskTexture: WebGLTexture | null;
  readonly frameTexture: WebGLTexture | null;
  readonly blurTexture1: WebGLTexture | null;
  readonly blurTexture2: WebGLTexture | null;
  readonly blurFbo1: WebGLFramebuffer | null;
  readonly blurFbo2: WebGLFramebuffer | null;

  private running = false;
  private static readonly DEFAULT_BG_COLOR: readonly [
    number,
    number,
    number,
    number,
  ] = [33, 150, 243, 255];
  private currentStateIndex = 0;
  private backgroundRenderInfo: BackgroundRenderInfo | null = null;
  private activeBackgroundSourceIdentifier: string | null = null;

  constructor(canvas: OffscreenCanvas) {
    this.canvas = canvas;
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      desynchronized: true,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    const stateUpdateVertexShaderSource = `attribute vec2 a_position; attribute vec2 a_texCoord; varying vec2 v_texCoord; void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_texCoord = a_texCoord; }`;
    const stateUpdateFragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_categoryTexture;
      uniform sampler2D u_confidenceTexture;
      uniform sampler2D u_prevStateTexture;
      uniform float u_smoothingFactor;
      uniform float u_smoothstepMin;
      uniform float u_smoothstepMax;
      uniform int u_selfieModel;

      void main() {
        vec2 prevCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
        float categoryValue = texture2D(u_categoryTexture, v_texCoord).r;
        float confidenceValue = texture2D(u_confidenceTexture, v_texCoord).r;

        if (u_selfieModel == 1) {
            categoryValue = 1.0 - categoryValue;
            confidenceValue = 1.0 - confidenceValue;
        }

        if (categoryValue > 0.0) {
            categoryValue = 1.0;
            confidenceValue = 1.0 - confidenceValue;
        }

        float nonLinearConfidence = smoothstep(u_smoothstepMin, u_smoothstepMax, confidenceValue);
        float prevCategoryValue = texture2D(u_prevStateTexture, prevCoord).r;
        float alpha = u_smoothingFactor * nonLinearConfidence;
        float newCategoryValue = alpha * categoryValue + (1.0 - alpha) * prevCategoryValue;

        gl_FragColor = vec4(newCategoryValue, 0.0, 0.0, 0.0);
      }
    `;
    this.stateUpdateProgram = this.createAndLinkProgram(
      stateUpdateVertexShaderSource,
      stateUpdateFragmentShaderSource,
    );
    this.stateUpdateLocations = {
      position: gl.getAttribLocation(this.stateUpdateProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.stateUpdateProgram, 'a_texCoord'),
      categoryTexture: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_categoryTexture',
      ),
      confidenceTexture: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_confidenceTexture',
      ),
      prevStateTexture: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_prevStateTexture',
      ),
      smoothingFactor: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_smoothingFactor',
      ),
      smoothstepMin: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_smoothstepMin',
      ),
      smoothstepMax: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_smoothstepMax',
      ),
      selfieModel: gl.getUniformLocation(
        this.stateUpdateProgram,
        'u_selfieModel',
      ),
    };

    const maskRefineVertexShaderSource = stateUpdateVertexShaderSource;
    const maskRefineFragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;

      uniform sampler2D u_maskTexture;
      uniform sampler2D u_frameTexture;
      uniform vec2 u_texelSize;
      uniform float u_sigmaSpatial;
      uniform float u_sigmaRange;

      void main() {
        vec2 flippedCoord = v_texCoord;
        vec3 centerPixelColor = texture2D(u_frameTexture, v_texCoord).rgb;
        float totalWeight = 0.0;
        float weightedMaskSum = 0.0;

        for (int offsetX = -2; offsetX <= 2; offsetX++) {
          for (int offsetY = -2; offsetY <= 2; offsetY++) {
            vec2 shift = vec2(float(offsetX), float(offsetY)) * u_texelSize;
            vec2 frameCoord = v_texCoord + shift;
            vec2 maskCoord = flippedCoord + shift;

            vec3 neighborPixelColor = texture2D(u_frameTexture, frameCoord).rgb;
            float neighborMaskValue = texture2D(u_maskTexture, maskCoord).r;

            float spatialWeight = exp(-dot(shift, shift) / (2.0 * u_sigmaSpatial * u_sigmaSpatial));
            vec3 colorDifference = neighborPixelColor - centerPixelColor;
            float rangeWeight = exp(-(dot(colorDifference, colorDifference)) / (2.0 * u_sigmaRange * u_sigmaRange));

            float combinedWeight = spatialWeight * rangeWeight;
            weightedMaskSum += neighborMaskValue * combinedWeight;
            totalWeight += combinedWeight;
          }
        }

        float refinedMaskValue = weightedMaskSum / max(totalWeight, 1e-6);
        gl_FragColor = vec4(refinedMaskValue, refinedMaskValue, refinedMaskValue, 1.0);
      }
    `;

    this.maskRefineProgram = this.createAndLinkProgram(
      maskRefineVertexShaderSource,
      maskRefineFragmentShaderSource,
    );
    this.maskRefineLocations = {
      position: gl.getAttribLocation(this.maskRefineProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.maskRefineProgram, 'a_texCoord'),
      maskTexture: gl.getUniformLocation(
        this.maskRefineProgram,
        'u_maskTexture',
      ),
      frameTexture: gl.getUniformLocation(
        this.maskRefineProgram,
        'u_frameTexture',
      ),
      texelSize: gl.getUniformLocation(this.maskRefineProgram, 'u_texelSize'),
      sigmaSpatial: gl.getUniformLocation(
        this.maskRefineProgram,
        'u_sigmaSpatial',
      ),
      sigmaRange: gl.getUniformLocation(this.maskRefineProgram, 'u_sigmaRange'),
    };

    const blurVertexShaderSource = stateUpdateVertexShaderSource;
    const blurFragmentShaderSource = `
      precision highp float;
      varying vec2 v_texCoord;

      uniform sampler2D u_image;
      uniform sampler2D u_personMask;
      uniform vec2 u_texelSize;
      uniform float u_sigma;
      uniform float u_radiusScale;
      uniform vec2 u_direction;

      const int KERNEL_RADIUS = 10;

      float gauss(float x, float s) {
        return exp(-(x * x) / (2.0 * s * s));
      }

      void main() {
        vec2 maskCoord = u_direction.y > 0.5 ? vec2(v_texCoord.x, 1.0 - v_texCoord.y) : v_texCoord;
        float mCenter = texture2D(u_personMask, maskCoord).r;
        float wCenter = gauss(0.0, u_sigma);
        vec4 accum = texture2D(u_image, v_texCoord) * wCenter * (1.0 - mCenter);
        float weightSum = wCenter * (1.0 - mCenter);

        for (int i = 1; i <= KERNEL_RADIUS; i++) {
          float f = float(i);
          float offset = f * u_radiusScale;
          float w = gauss(offset, u_sigma);
          vec2 texOffset = u_direction * offset * u_texelSize;

          vec2 uvPlus = v_texCoord + texOffset;
          vec2 maskCoordPlus = u_direction.y > 0.5 ? vec2(uvPlus.x, 1.0 - uvPlus.y) : uvPlus;
          float mPlus = texture2D(u_personMask, maskCoordPlus).r;
          accum += texture2D(u_image, uvPlus) * w * (1.0 - mPlus);
          weightSum += w * (1.0 - mPlus);

          vec2 uvMinus = v_texCoord - texOffset;
          vec2 maskCoordMinus = u_direction.y > 0.5 ? vec2(uvMinus.x, 1.0 - uvMinus.y) : uvMinus;
          float mMinus = texture2D(u_personMask, maskCoordMinus).r;
          accum += texture2D(u_image, uvMinus) * w * (1.0 - mMinus);
          weightSum += w * (1.0 - mMinus);
        }

        vec4 blurred = accum / max(weightSum, 1e-6);
        gl_FragColor = blurred;
      }
    `;

    this.blurProgram = this.createAndLinkProgram(
      blurVertexShaderSource,
      blurFragmentShaderSource,
    );
    this.blurLocations = {
      position: gl.getAttribLocation(this.blurProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.blurProgram, 'a_texCoord'),
      image: gl.getUniformLocation(this.blurProgram, 'u_image'),
      personMask: gl.getUniformLocation(this.blurProgram, 'u_personMask'),
      texelSize: gl.getUniformLocation(this.blurProgram, 'u_texelSize'),
      sigma: gl.getUniformLocation(this.blurProgram, 'u_sigma'),
      radiusScale: gl.getUniformLocation(this.blurProgram, 'u_radiusScale'),
      direction: gl.getUniformLocation(this.blurProgram, 'u_direction'),
    };

    const blendVertexShaderSource = stateUpdateVertexShaderSource;
    const blendFragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;

      uniform sampler2D u_frameTexture;
      uniform sampler2D u_currentStateTexture;
      uniform sampler2D u_backgroundTexture;
      uniform vec2 u_bgImageDimensions;
      uniform vec2 u_canvasDimensions;
      uniform float u_borderSmooth;
      uniform float u_bgBlur;
      uniform float u_bgBlurRadius;
      uniform int u_enabled;

      vec4 getMixedFragColor(vec2 bgTexCoord, vec2 categoryCoord, vec2 offset) {
          vec4 backgroundColor = texture2D(u_backgroundTexture, bgTexCoord + offset);
          vec4 frameColor = texture2D(u_frameTexture, v_texCoord + offset);
          float categoryValue = texture2D(u_currentStateTexture, categoryCoord + offset).r;
          return mix(backgroundColor, frameColor, categoryValue);
      }

      void main() {
        if (u_enabled == 0) {
          gl_FragColor = texture2D(u_frameTexture, v_texCoord);
          return;
        }

        vec2 categoryCoord = v_texCoord;
        float categoryValue = texture2D(u_currentStateTexture, categoryCoord).r;

        float canvasAspect = u_canvasDimensions.x / u_canvasDimensions.y;
          float bgAspect = u_bgImageDimensions.x / u_bgImageDimensions.y;

          vec2 bgTexCoord = v_texCoord;
          float scaleX = 1.0;
          float scaleY = 1.0;
          float offsetX = 0.0;
          float offsetY = 0.0;

          if (canvasAspect < bgAspect) {
              scaleY = 1.0;
              scaleX = bgAspect / canvasAspect;
              offsetX = (1.0 - scaleX) / 2.0;
          } else {
              scaleX = 1.0;
              scaleY = canvasAspect / bgAspect;
              offsetY = (1.0 - scaleY) / 2.0;
          }

          bgTexCoord = vec2((v_texCoord.x - offsetX) / scaleX, (v_texCoord.y - offsetY) / scaleY);
          gl_FragColor = getMixedFragColor(bgTexCoord, categoryCoord, vec2(0.0, 0.0));
    }`;

    this.blendProgram = this.createAndLinkProgram(
      blendVertexShaderSource,
      blendFragmentShaderSource,
    );
    this.blendLocations = {
      position: gl.getAttribLocation(this.blendProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.blendProgram, 'a_texCoord'),
      frameTexture: gl.getUniformLocation(this.blendProgram, 'u_frameTexture'),
      currentStateTexture: gl.getUniformLocation(
        this.blendProgram,
        'u_currentStateTexture',
      ),
      backgroundTexture: gl.getUniformLocation(
        this.blendProgram,
        'u_backgroundTexture',
      ),
      bgImageDimensions: gl.getUniformLocation(
        this.blendProgram,
        'u_bgImageDimensions',
      ),
      canvasDimensions: gl.getUniformLocation(
        this.blendProgram,
        'u_canvasDimensions',
      ),
      borderSmooth: gl.getUniformLocation(this.blendProgram, 'u_borderSmooth'),
      bgBlur: gl.getUniformLocation(this.blendProgram, 'u_bgBlur'),
      bgBlurRadius: gl.getUniformLocation(this.blendProgram, 'u_bgBlurRadius'),
      enabled: gl.getUniformLocation(this.blendProgram, 'u_enabled'),
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

    this.storedStateTextures = Array.from({ length: 2 }, () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255]),
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    });
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.fbo = gl.createFramebuffer();
    this.refineFbo = gl.createFramebuffer();

    const refinedTex = gl.createTexture();
    this.frameTexture = gl.createTexture();
    if (!refinedTex) throw new Error('Failed to create refined mask texture');
    gl.bindTexture(gl.TEXTURE_2D, refinedTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.refinedMaskTexture = refinedTex;

    const mkColorTex = () => {
      const t = gl.createTexture();
      if (!t) throw new Error('Failed to create blur texture');
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return t;
    };
    this.blurTexture1 = mkColorTex();
    this.blurTexture2 = mkColorTex();

    const mkFbo = (tex: WebGLTexture | null) => {
      const fb = gl.createFramebuffer();
      if (!fb || !tex) throw new Error('Failed to create blur FBO');
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
    this.blurFbo1 = mkFbo(this.blurTexture1);
    this.blurFbo2 = mkFbo(this.blurTexture2);

    this.running = true;
  }

  private createAndLinkProgram(
    vsSource: string,
    fsSource: string,
  ): WebGLProgram {
    const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    const prog = this.gl.createProgram();
    if (!prog) throw new Error('Failed to create program');
    this.gl.attachShader(prog, vs);
    this.gl.attachShader(prog, fs);
    this.gl.linkProgram(prog);
    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(prog));
      this.gl.deleteProgram(prog);
      throw new Error('Link fail');
    }
    this.gl.detachShader(prog, vs);
    this.gl.detachShader(prog, fs);
    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
    return prog;
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error(`Failed to create shader type: ${type}`);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      throw new Error('Failed to compile shader');
    }
    return shader;
  }

  private createColorTexture(
    r: number,
    g: number,
    b: number,
    a: number,
  ): {
    texture: WebGLTexture;
    color: readonly [number, number, number, number];
  } {
    const texture = this.gl.createTexture();
    if (!texture) throw new Error('Failed to create texture for color');
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([r, g, b, a]);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      pixel,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST,
    );
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return { texture, color: [r, g, b, a] as const };
  }

  private updateBackgroundIfNeeded(newSource?: BackgroundSource | null) {
    const gl = this.gl;
    let newIdentifier: string;

    if (!newSource) {
      const [r, g, b, a] = WebGLRenderer.DEFAULT_BG_COLOR;
      newIdentifier = `color(${r},${g},${b},${a})`;
    } else {
      newIdentifier = newSource.url;
    }

    if (
      newIdentifier === this.activeBackgroundSourceIdentifier &&
      this.backgroundRenderInfo
    ) {
      return;
    }

    if (this.backgroundRenderInfo) {
      gl.deleteTexture(this.backgroundRenderInfo.texture);
      this.backgroundRenderInfo = null;
    }
    this.activeBackgroundSourceIdentifier = newIdentifier;

    if (!newSource) {
      const [r, g, b, a] = WebGLRenderer.DEFAULT_BG_COLOR;
      const colorTexData = this.createColorTexture(r, g, b, a);
      this.backgroundRenderInfo = {
        type: 'color',
        texture: colorTexData.texture,
        color: colorTexData.color,
      };
      this.activeBackgroundSourceIdentifier = `color(${r},${g},${b},${a})`;
    } else {
      if (newSource.type === 'image') {
        const { media, url } = newSource as { media: ImageBitmap; url: string };
        const texture = this.gl.createTexture();
        if (!texture) {
          throw new Error('Failed to create texture object for image.');
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          media,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR,
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        this.backgroundRenderInfo = {
          type: 'image',
          texture,
          width: media.width,
          height: media.height,
          url,
        };
      } else if (newSource.type === 'video') {
        const { media, url } = newSource as {
          media: ReadableStream;
          url: string;
        };

        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        const writer = new WritableStream({
          write(videoFrame: VideoFrame) {
            canvas.width = videoFrame.codedWidth;
            canvas.height = videoFrame.codedHeight;
            ctx?.drawImage(videoFrame, 0, 0);
            videoFrame.close();
          },
          close() {
            console.log('[virtual-background] video background close');
          },
        });
        media.pipeTo(writer).catch((err) => {
          console.error('media.pipeTo(writer) error', err);
        });

        const texture = this.gl.createTexture();
        if (!texture) throw new Error('Failed to create texture for video');
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          1,
          1,
          0,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          null,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR,
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR,
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        this.backgroundRenderInfo = {
          type: 'video',
          texture,
          url,
          media,
          canvas,
        };
      }
    }

    if (!this.backgroundRenderInfo) {
      console.error(
        'Critical: backgroundRenderInfo is null after processing new source. Setting default color.',
      );
      const [r, g, b, a] = WebGLRenderer.DEFAULT_BG_COLOR;
      const colorTexData = this.createColorTexture(r, g, b, a);
      this.backgroundRenderInfo = {
        type: 'color',
        texture: colorTexData.texture,
        color: colorTexData.color,
      };
      this.activeBackgroundSourceIdentifier = `color(${r},${g},${b},${a})`;
    }
  }

  public render(
    videoFrame: VideoFrame,
    options: {
      backgroundSource?: BackgroundSource | null;
      bgBlur: number;
      bgBlurRadius: number;
      isSelfieMode: boolean;
    },
    categoryTexture?: WebGLTexture,
    confidenceTexture?: WebGLTexture,
  ) {
    if (!this.running) return;
    const {
      gl,
      fbo,
      frameTexture,
      storedStateTextures,
      stateUpdateProgram,
      stateUpdateLocations,
      refineFbo,
      refinedMaskTexture,
      maskRefineProgram,
      maskRefineLocations,
      blendProgram,
      blendLocations,
      blurFbo1,
      blurFbo2,
      blurTexture1,
      blurTexture2,
    } = this;

    const { displayWidth: width, displayHeight: height } = videoFrame;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    if (!categoryTexture || !confidenceTexture) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.useProgram(blendProgram);

      const frame = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, frame);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        videoFrame,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.uniform1i(blendLocations.frameTexture, 0);
      gl.uniform1i(blendLocations.enabled, 0);

      gl.enableVertexAttribArray(blendLocations.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.vertexAttribPointer(blendLocations.position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(blendLocations.texCoord);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.vertexAttribPointer(blendLocations.texCoord, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.deleteTexture(frame);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);

      return;
    }

    const readStateIndex = this.currentStateIndex;
    const writeStateIndex = (this.currentStateIndex + 1) % 2;
    const prevStateTexture = storedStateTextures[readStateIndex];
    const newStateTexture = storedStateTextures[writeStateIndex];

    this.updateBackgroundIfNeeded(options.backgroundSource);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      newStateTexture,
      0,
    );

    gl.bindTexture(gl.TEXTURE_2D, newStateTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );

    gl.viewport(0, 0, width, height);
    gl.useProgram(stateUpdateProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, categoryTexture);
    gl.uniform1i(stateUpdateLocations.categoryTexture, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, confidenceTexture);
    gl.uniform1i(stateUpdateLocations.confidenceTexture, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, prevStateTexture);
    gl.uniform1i(stateUpdateLocations.prevStateTexture, 2);

    gl.uniform1f(stateUpdateLocations.smoothingFactor, 0.8);
    gl.uniform1f(stateUpdateLocations.smoothstepMin, 0.6);
    gl.uniform1f(stateUpdateLocations.smoothstepMax, 0.9);

    gl.uniform1i(
      stateUpdateLocations.selfieModel,
      options.isSelfieMode ? 1 : 0,
    );

    gl.enableVertexAttribArray(stateUpdateLocations.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(
      stateUpdateLocations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.enableVertexAttribArray(stateUpdateLocations.texCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(
      stateUpdateLocations.texCoord,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, refineFbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      refinedMaskTexture,
      0,
    );

    gl.bindTexture(gl.TEXTURE_2D, refinedMaskTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );

    gl.viewport(0, 0, width, height);
    gl.useProgram(maskRefineProgram);

    gl.enableVertexAttribArray(maskRefineLocations.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(
      maskRefineLocations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.enableVertexAttribArray(maskRefineLocations.texCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(
      maskRefineLocations.texCoord,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, newStateTexture);
    gl.uniform1i(maskRefineLocations.maskTexture, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      videoFrame,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(maskRefineLocations.frameTexture, 1);

    gl.uniform2f(maskRefineLocations.texelSize, 1.0 / width, 1.0 / height);
    gl.uniform1f(maskRefineLocations.sigmaSpatial, 2.0);
    gl.uniform1f(maskRefineLocations.sigmaRange, 0.1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(maskRefineLocations.position);
    gl.disableVertexAttribArray(maskRefineLocations.texCoord);

    let backgroundTexToUse: WebGLTexture | null;
    let bgWToSend = width;
    let bgHToSend = height;

    if (options.bgBlur > 0 && options.bgBlurRadius > 0) {
      const downscale = 0.5;
      const blurW = Math.floor(width * downscale);
      const blurH = Math.floor(height * downscale);

      gl.bindTexture(gl.TEXTURE_2D, blurTexture1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        blurW,
        blurH,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.bindTexture(gl.TEXTURE_2D, blurTexture2);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        blurW,
        blurH,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );

      const KERNEL_RADIUS = 10.0;
      const radiusScale = Math.max(0.0, options.bgBlurRadius) / KERNEL_RADIUS;

      gl.useProgram(this.blurProgram);

      gl.enableVertexAttribArray(this.blurLocations.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.vertexAttribPointer(
        this.blurLocations.position,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );
      gl.enableVertexAttribArray(this.blurLocations.texCoord);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.vertexAttribPointer(
        this.blurLocations.texCoord,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, refinedMaskTexture);
      gl.uniform1i(this.blurLocations.personMask, 1);
      gl.uniform1f(this.blurLocations.sigma, options.bgBlur * 0.7);
      gl.uniform1f(this.blurLocations.radiusScale, radiusScale);

      const blurPasses = [
        {
          direction: [1.0, 0.0],
          input: frameTexture,
          output: blurFbo1,
          texelSize: [1.0 / width, 1.0 / height],
        },
        {
          direction: [0.0, 1.0],
          input: blurTexture1,
          output: blurFbo2,
          texelSize: [1.0 / blurW, 1.0 / blurH],
        },
        {
          direction: [1.0, 0.0],
          input: blurTexture2,
          output: blurFbo1,
          texelSize: [1.0 / blurW, 1.0 / blurH],
        },
        {
          direction: [0.0, 1.0],
          input: blurTexture1,
          output: blurFbo2,
          texelSize: [1.0 / blurW, 1.0 / blurH],
        },
      ];

      for (const pass of blurPasses) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pass.output);
        gl.viewport(0, 0, blurW, blurH);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pass.input);
        gl.uniform1i(this.blurLocations.image, 0);
        gl.uniform2f(
          this.blurLocations.texelSize,
          pass.texelSize[0],
          pass.texelSize[1],
        );
        gl.uniform2f(
          this.blurLocations.direction,
          pass.direction[0],
          pass.direction[1],
        );

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      backgroundTexToUse = blurTexture2!;
      bgWToSend = blurW;
      bgHToSend = blurH;
    } else if (options.backgroundSource && this.backgroundRenderInfo) {
      backgroundTexToUse = this.backgroundRenderInfo.texture;
      if (this.backgroundRenderInfo.type === 'video') {
        const { canvas } = this.backgroundRenderInfo;
        bgWToSend = canvas.width || width;
        bgHToSend = canvas.height || height;
      } else if (this.backgroundRenderInfo.type === 'image') {
        bgWToSend = this.backgroundRenderInfo.width;
        bgHToSend = this.backgroundRenderInfo.height;
      } else {
        bgWToSend = width;
        bgHToSend = height;
      }
    } else {
      backgroundTexToUse = this.backgroundRenderInfo?.texture ?? null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(blendProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.uniform1i(blendLocations.frameTexture, 0);
    gl.uniform1f(blendLocations.borderSmooth, 0);
    gl.uniform1f(blendLocations.bgBlur, options.bgBlur);
    gl.uniform1f(blendLocations.bgBlurRadius, options.bgBlurRadius);
    gl.uniform1i(blendLocations.enabled, 1);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, refinedMaskTexture);
    gl.uniform1i(blendLocations.currentStateTexture, 1);

    if (backgroundTexToUse) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, backgroundTexToUse);

      gl.uniform1i(blendLocations.backgroundTexture, 2);
      gl.uniform2f(blendLocations.bgImageDimensions, bgWToSend, bgHToSend);
      gl.uniform2f(blendLocations.canvasDimensions, width, height);
    } else {
      gl.uniform2f(blendLocations.bgImageDimensions, width, height);
      gl.uniform2f(blendLocations.canvasDimensions, width, height);
    }

    gl.enableVertexAttribArray(blendLocations.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(blendLocations.position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(blendLocations.texCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(blendLocations.texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    for (let i = 0; i < 3; ++i) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    this.currentStateIndex = writeStateIndex;
  }

  public close() {
    if (!this.running) return;
    this.running = false;

    const { gl, fbo, refineFbo, refinedMaskTexture, blurFbo1, blurFbo2 } = this;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (fbo) gl.deleteFramebuffer(fbo);
    if (refineFbo) gl.deleteFramebuffer(refineFbo);
    if (blurFbo1) gl.deleteFramebuffer(blurFbo1);
    if (blurFbo2) gl.deleteFramebuffer(blurFbo2);

    gl.deleteProgram(this.stateUpdateProgram);
    gl.deleteProgram(this.maskRefineProgram);
    gl.deleteProgram(this.blurProgram);
    gl.deleteProgram(this.blendProgram);

    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);

    if (refinedMaskTexture) gl.deleteTexture(refinedMaskTexture);
    if (this.blurTexture1) gl.deleteTexture(this.blurTexture1);
    if (this.blurTexture2) gl.deleteTexture(this.blurTexture2);
    this.storedStateTextures.forEach((t) => t && gl.deleteTexture(t));
    this.storedStateTextures.splice(0, this.storedStateTextures.length);
    if (this.backgroundRenderInfo?.texture) {
      gl.deleteTexture(this.backgroundRenderInfo.texture);
      this.backgroundRenderInfo = null;
    }
    this.activeBackgroundSourceIdentifier = null;
  }
}
