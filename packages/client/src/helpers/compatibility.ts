/**
 * Checks if the current platform is a mobile device.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
 */
export const isMobile = () => /Mobi/i.test(navigator.userAgent);
