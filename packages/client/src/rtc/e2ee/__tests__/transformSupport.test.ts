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

  const setScriptTransform = (available: boolean) => {
    if (available) return;
    const original = globalThis.RTCRtpScriptTransform;
    delete globalThis.RTCRtpScriptTransform;
    return () => {
      globalThis.RTCRtpScriptTransform = original;
    };
  };

  // The whole selection policy is this matrix. Chrome is pinned to Insertable
  // Streams wherever it exists, because its RTCRtpScriptTransform is still
  // unreliable for E2EE; everything else prefers the standard API.
  it.each([
    ['chrome', true, true, true, 'insertable'],
    ['chrome, no insertable streams', true, false, true, 'script'],
    ['chrome, neither API', true, false, false, undefined],
    ['non-chrome', false, true, true, 'script'],
    ['non-chrome, no script transform', false, true, false, 'insertable'],
    ['non-chrome, neither API', false, false, false, undefined],
  ] as const)('%s', (_label, chrome, insertable, script, expected) => {
    vi.mocked(isChrome).mockReturnValue(chrome);
    setInsertableStreams(insertable);
    const restore = setScriptTransform(script);
    try {
      expect(preferredTransform()).toBe(expected);
    } finally {
      restore?.();
    }
  });
});
