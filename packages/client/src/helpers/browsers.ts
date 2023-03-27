/**
 * Checks whether the current browser is Safari.
 */
export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');
};

/**
 * Checks whether the current browser is Firefox.
 */
export const isFirefox = () => {
  return navigator.userAgent?.includes('Firefox');
};

/**
 * Checks whether the current browser is Google Chrome.
 */
export const isChrome = () => {
  return navigator.userAgent?.includes('Chrome');
};
