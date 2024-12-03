import { describe, expect, it } from 'vitest';
import { getPayloadTypeForCodec } from '../sdp';
import { publisherSDP } from './publisher-sdp.mock';

describe('sdp-munging', () => {
  it('extracts payload type for codec', () => {
    const payload = getPayloadTypeForCodec(
      publisherSDP,
      'video/vp9',
      'profile-id=2',
    );
    expect(payload).toBe(100);
  });
});
