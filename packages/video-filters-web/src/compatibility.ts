import { simd } from 'wasm-feature-detect';

export type PlatformSupportFlags = {
  /**
   * Forces support for mobile devices, although performance isn't optimal.
   */
  forceMobileSupport?: boolean;

  /**
   * Forces support for Safari, although in cases where the tab is put in the background,
   * the FPS can drop significantly or freeze completely due to intensive timer throttling.
   */
  forceSafariSupport?: boolean;
};

/**
 * Checks if the current platform is a mobile device.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
 */
const isMobile = () => /Mobi/i.test(navigator.userAgent);

/**
 * Checks whether the current browser is Safari.
 */
const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Runs a check to see if the current platform supports
 * the necessary APIs required for the video filters.
 */
export const isPlatformSupported = async ({
  forceMobileSupport = false,
  forceSafariSupport = false,
}: PlatformSupportFlags = {}) =>
  typeof document !== 'undefined' &&
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  // we don't support mobile devices yet due to performance issues
  (forceMobileSupport || !isMobile()) &&
  // Safari has issues with timer throttling, causing low FPS when the tab goes to the background
  (forceSafariSupport || !isSafari()) &&
  typeof WebAssembly !== 'undefined' &&
  !!window.WebGL2RenderingContext && // WebGL2 is required for the video filters
  !!document.createElement('canvas').getContext('webgl2') &&
  (await simd()); // SIMD is required for the wasm module

/**
 * Runs a check to see if the current platform supports
 * the necessary APIs required for the MediaPipe-based video filters.
 */
export const isMediaPipePlatformSupported = async ({
  forceMobileSupport = false,
  forceSafariSupport = false,
}: PlatformSupportFlags = {}) =>
  typeof document !== 'undefined' &&
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  // we don't support mobile devices yet due to performance issues
  (forceMobileSupport || !isMobile()) &&
  // Safari has issues with timer throttling, causing low FPS when the tab goes to the background
  (forceSafariSupport || !isSafari()) &&
  typeof WebAssembly !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' && // OffscreenCanvas is required for efficient rendering
  !!window.WebGL2RenderingContext && // WebGL2 is required for the video filters
  !!new OffscreenCanvas(1, 1).getContext('webgl2') &&
  typeof VideoFrame !== 'undefined' && // VideoFrame API is required for frame processing
  typeof createImageBitmap !== 'undefined'; // createImageBitmap is required for background image processing
