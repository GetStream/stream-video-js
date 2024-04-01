import { simd } from 'wasm-feature-detect';

/**
 * Checks if the current platform is a mobile device.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
 */
const isMobile = () => /Mobi/i.test(navigator.userAgent);

/**
 * Runs a check to see if the current platform supports
 * the necessary APIs required for the video filters.
 */
export const isPlatformSupported = async () =>
  typeof document !== 'undefined' &&
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  !isMobile() && // we don't support mobile devices yet due to performance issues
  typeof WebAssembly !== 'undefined' &&
  !!window.WebGL2RenderingContext && // WebGL2 is required for the video filters
  !!document.createElement('canvas').getContext('webgl2') &&
  (await simd()); // SIMD is required for the wasm module
