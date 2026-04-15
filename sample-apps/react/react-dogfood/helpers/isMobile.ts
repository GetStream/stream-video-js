export const isMobile = () =>
  typeof navigator !== 'undefined' && /Mobi/i.test(navigator.userAgent);
