import { getClientDetails } from './client-details';

/**
 * Checks whether the current browser is Safari.
 */
export const isSafari = () => {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');
};

/**
 * Checks whether the current runtime is a WebKit-engine browser.
 * Safari (desktop / iOS) or an iOS WKWebView host.
 */
export const isWebKit = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (!/AppleWebKit\//.test(ua)) return false;
  // Chromium reuses the AppleWebKit/ token; exclude every Chromium /
  // Gecko derivative that ships on iOS or otherwise.
  const regExp = /Chrome\/|Chromium\/|CriOS\/|EdgiOS\/|OPiOS\/|FxiOS\/|Android/;
  return !regExp.test(ua);
};

/**
 * Checks whether the current browser is Firefox.
 */
export const isFirefox = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent?.includes('Firefox');
};

/**
 * Checks whether the current browser is Google Chrome.
 */
export const isChrome = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent?.includes('Chrome');
};

/**
 * Checks whether the current browser is among the list of first-class supported browsers.
 * This includes Chrome, Edge, Firefox, and Safari.
 *
 * Although the Stream Video SDK may work in other browsers, these are the ones we officially support.
 */
export const isSupportedBrowser = async (): Promise<boolean> => {
  const { browser } = await getClientDetails();
  if (!browser) return false; // we aren't running in a browser

  const name = browser.name.toLowerCase();
  const [major] = browser.version.split('.');
  const version = parseInt(major, 10);
  return (
    (name.includes('chrome') && version >= 124) ||
    (name.includes('edge') && version >= 124) ||
    (name.includes('firefox') && version >= 124) ||
    (name.includes('safari') && version >= 17) ||
    (name.includes('webkit') && version >= 605) || // WebView on iOS
    (name.includes('webview') && version >= 124) // WebView on Android
  );
};
