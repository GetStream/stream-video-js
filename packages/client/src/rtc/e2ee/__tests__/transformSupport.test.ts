import '../../__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { preferredTransform } from '../transformSupport';
import { isChrome } from '../../../helpers/browsers';

// Mock browser detection so we can drive the Chrome vs non-Chrome transform
// selection deterministically. Defaults to non-Chrome (reset in beforeEach).
vi.mock('../../../helpers/browsers', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../helpers/browsers')>();
  return { ...actual, isChrome: vi.fn().mockReturnValue(false) };
});

describe('preferredTransform', () => {
  const setInsertableStreams = (available: boolean) => {
    if (available) {
      Object.assign(RTCRtpSender.prototype, {
        createEncodedStreams: vi.fn(),
      });
    } else {
      // @ts-expect-error - cleaning up non-standard property from mock prototype
      delete RTCRtpSender.prototype.createEncodedStreams;
    }
  };

  beforeEach(() => {
    vi.mocked(isChrome).mockReturnValue(false);
  });

  afterEach(() => {
    // @ts-expect-error - cleaning up non-standard property from mock prototype
    delete RTCRtpSender.prototype.createEncodedStreams;
  });

  it('defaults Chrome to Insertable Streams', () => {
    vi.mocked(isChrome).mockReturnValue(true);
    setInsertableStreams(true);
    expect(preferredTransform()).toBe('insertable');
  });

  it('falls back to RTCRtpScriptTransform on Chrome without Insertable Streams', () => {
    vi.mocked(isChrome).mockReturnValue(true);
    setInsertableStreams(false);
    expect(preferredTransform()).toBe('script');
  });

  it('prefers RTCRtpScriptTransform on non-Chrome browsers', () => {
    vi.mocked(isChrome).mockReturnValue(false);
    setInsertableStreams(true);
    expect(preferredTransform()).toBe('script');
  });

  it('falls back to Insertable Streams on non-Chrome without RTCRtpScriptTransform', () => {
    vi.mocked(isChrome).mockReturnValue(false);
    setInsertableStreams(true);
    const original = globalThis.RTCRtpScriptTransform;
    delete globalThis.RTCRtpScriptTransform;
    try {
      expect(preferredTransform()).toBe('insertable');
    } finally {
      globalThis.RTCRtpScriptTransform = original;
    }
  });

  it('returns undefined when neither API is available', () => {
    setInsertableStreams(false);
    const original = globalThis.RTCRtpScriptTransform;
    delete globalThis.RTCRtpScriptTransform;
    try {
      expect(preferredTransform()).toBeUndefined();
    } finally {
      globalThis.RTCRtpScriptTransform = original;
    }
  });
});
