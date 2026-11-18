import { isIOS } from './browsers';

/**
 * Checks if the current platform is a mobile device.
 * iPadOS counts as mobile even though it reports a desktop Mac user agent.
 *
 * See:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
 */
export const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Mobi/i.test(navigator.userAgent || '') || isIOS();
};
