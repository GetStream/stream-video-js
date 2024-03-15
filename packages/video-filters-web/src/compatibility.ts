import { simd } from 'wasm-feature-detect';

/**
 * Runs a check to see if the current platform supports
 * the necessary APIs required for the video filters.
 */
export const isPlatformSupported = async () =>
  typeof document !== 'undefined' &&
  typeof WebAssembly !== 'undefined' &&
  !!window.WebGL2RenderingContext &&
  !!document.createElement('canvas').getContext('webgl2') &&
  (await simd());
