import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMobile } from '../compatibility';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const MAC_SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const WINDOWS_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const stubNavigator = (userAgent: string, maxTouchPoints = 0) =>
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints });

describe('isMobile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when navigator is not available', () => {
    vi.stubGlobal('navigator', undefined);
    expect(isMobile()).toBe(false);
  });

  it('returns true for phones', () => {
    stubNavigator(IPHONE_UA, 5);
    expect(isMobile()).toBe(true);
    stubNavigator(ANDROID_UA, 5);
    expect(isMobile()).toBe(true);
  });

  it('returns true for iPadOS, which reports a desktop Mac user agent', () => {
    stubNavigator(MAC_SAFARI_UA, 5);
    expect(isMobile()).toBe(true);
  });

  it('returns false for desktop browsers', () => {
    stubNavigator(MAC_SAFARI_UA, 0);
    expect(isMobile()).toBe(false);
    stubNavigator(WINDOWS_CHROME_UA, 0);
    expect(isMobile()).toBe(false);
  });
});
