import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isChrome,
  isFirefox,
  isSafari,
  isSupportedBrowser,
  isWebKit,
} from '../browsers';
import { getClientDetails } from '../client-details';
import { ClientDetails } from '../../gen/video/sfu/models/models';

describe('browsers', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: '' },
      writable: true,
    });
  });

  describe('isSafari', () => {
    it('should return false if navigator is undefined', () => {
      expect(isSafari()).toBe(false);
    });

    it('should return true for Safari user agent', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15';
      expect(isSafari()).toBe(true);
    });

    it('should return false for Chrome user agent', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      expect(isSafari()).toBe(false);
    });
  });

  describe('isWebKit', () => {
    it('should return false for an empty user agent', () => {
      expect(isWebKit()).toBe(false);
    });

    it('should return true for Safari on macOS', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      expect(isWebKit()).toBe(true);
    });

    it('should return true for Safari on iOS', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
      expect(isWebKit()).toBe(true);
    });

    it('should return true for the default iOS WKWebView (no "Safari" token)', () => {
      // The key case isSafari misses: default WKWebView UA omits the
      // Safari token unless the host sets `applicationNameForUserAgent`.
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
      expect(isWebKit()).toBe(true);
    });

    it('should return false for Chrome on macOS', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      expect(isWebKit()).toBe(false);
    });

    it('should return true for Chrome on iOS (CriOS) — still WKWebView underneath', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1';
      expect(isWebKit()).toBe(true);
    });

    it('should return true for Edge on iOS (EdgiOS) — still WKWebView underneath', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1';
      expect(isWebKit()).toBe(true);
    });

    it('should return true for Opera on iOS (OPiOS) — still WKWebView underneath', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 OPiOS/16.0.0 Mobile/15E148 Safari/9537.53';
      expect(isWebKit()).toBe(true);
    });

    it('should return true for Firefox on iOS (FxiOS) — still WKWebView underneath', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15';
      expect(isWebKit()).toBe(true);
    });

    it('should return false for Firefox on desktop (no AppleWebKit token)', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      expect(isWebKit()).toBe(false);
    });

    it('should return false for Android Chrome', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      expect(isWebKit()).toBe(false);
    });
  });

  describe('isFirefox', () => {
    it('should return false if navigator is undefined', () => {
      expect(isFirefox()).toBe(false);
    });

    it('should return true for Firefox user agent', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      expect(isFirefox()).toBe(true);
    });

    it('should return false for Chrome user agent', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      expect(isFirefox()).toBe(false);
    });
  });

  describe('isChrome', () => {
    it('should return false if navigator is undefined', () => {
      expect(isChrome()).toBe(false);
    });

    it('should return true for Chrome user agent', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      expect(isChrome()).toBe(true);
    });

    it('should return false for Firefox user agent', () => {
      // @ts-expect-error - mocking navigator
      globalThis.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      expect(isChrome()).toBe(false);
    });
  });

  describe('isSupportedBrowser', () => {
    vi.mock('../client-details', () => ({
      getClientDetails: vi.fn(),
    }));

    it('should return false if browser is undefined', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: undefined,
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return true for supported Chrome version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Chrome', version: '124' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return true for supported Chrome detailed version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Chrome', version: '124.0.7204.158' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return false for unsupported Chrome version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Chrome', version: '123' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return false for unsupported Chrome detailed version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Chrome', version: '123.0.1234.99' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return true for supported Edge version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Edge', version: '124' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return false for unsupported Edge version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Edge', version: '123' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return true for supported Firefox version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Firefox', version: '124' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return false for unsupported Firefox version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Firefox', version: '123' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return true for supported Safari version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Safari', version: '17' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return false for unsupported Safari version', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Safari', version: '16' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return true for supported WebKit version (WebView on iOS)', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'WebKit', version: '605' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return false for unsupported WebKit version (WebView on iOS)', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'WebKit', version: '604' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return true for supported WebView version (WebView on Android)', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'WebView', version: '124' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(true);
    });

    it('should return false for unsupported WebView version (WebView on Android)', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'WebView', version: '123' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });

    it('should return false for unsupported browser', async () => {
      vi.mocked(getClientDetails).mockResolvedValue({
        browser: { name: 'Opera', version: '78' },
      } as ClientDetails);
      expect(await isSupportedBrowser()).toBe(false);
    });
  });
});
