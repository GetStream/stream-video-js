/**
 * Checks whether the current runtime runs on WebKit: Safari, every iOS browser,
 * and WKWebView hosts (whose user agent may omit the `Safari` token).
 * Mirrors `isWebKit()` from `@stream-io/video-client`.
 */
export const isWebKit = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (!/AppleWebKit\//.test(ua)) return false;
  // Desktop Chromium reuses the AppleWebKit/ token
  return !/Chrome\/|Chromium\/|Android/.test(ua);
};
