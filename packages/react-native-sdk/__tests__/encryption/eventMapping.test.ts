import {
  RTCEncryptionAlgorithm,
  RTCEncryptionTrackType,
} from '@stream-io/react-native-webrtc';
import {
  algorithmToNative,
  mapNativeEvent,
  trackTypeFromNative,
  trackTypeToNative,
} from '../../src/modules/encryption/eventMapping';

describe('trackType mapping', () => {
  it.each([
    ['AUDIO', RTCEncryptionTrackType.AUDIO],
    ['VIDEO', RTCEncryptionTrackType.VIDEO],
    ['SCREEN_SHARE', RTCEncryptionTrackType.SCREEN_SHARE],
    ['SCREEN_SHARE_AUDIO', RTCEncryptionTrackType.SCREEN_SHARE_AUDIO],
  ])('round-trips %s', (name, native) => {
    expect(trackTypeToNative(name)).toBe(native);
    expect(trackTypeFromNative(native)).toBe(name);
  });

  it('keeps screen-share audio distinct from microphone audio', () => {
    // Native keys replay state per (userId, trackType), so collapsing the two
    // mis-groups it - the bug the iOS SDK shipped.
    expect(trackTypeToNative('SCREEN_SHARE_AUDIO')).not.toBe(
      trackTypeToNative('AUDIO'),
    );
  });

  it('maps unknown and absent track types to undefined', () => {
    expect(trackTypeToNative(undefined)).toBeUndefined();
    expect(trackTypeToNative('UNSPECIFIED')).toBeUndefined();
    expect(trackTypeToNative('audio')).toBeUndefined();
    expect(trackTypeFromNative(undefined)).toBeUndefined();
    expect(trackTypeFromNative(99)).toBeUndefined();
  });
});

describe('algorithmToNative', () => {
  it('maps both algorithms', () => {
    expect(algorithmToNative('AES-128-GCM')).toBe(
      RTCEncryptionAlgorithm.AES_128_GCM,
    );
    expect(algorithmToNative('AES-256-GCM')).toBe(
      RTCEncryptionAlgorithm.AES_256_GCM,
    );
  });
});

describe('mapNativeEvent', () => {
  const base = { managerId: 'handle-1', userId: 'alice' };

  it('drops the bridge-only fields from every payload', () => {
    const mapped = mapNativeEvent({
      ...base,
      type: 'e2ee.decryption_failed',
      trackType: RTCEncryptionTrackType.VIDEO,
    } as never);
    expect(mapped).toEqual({
      type: 'e2ee.decryption_failed',
      payload: { userId: 'alice', trackType: 'VIDEO' },
    });
    expect(Object.keys(mapped!.payload)).toEqual(['userId', 'trackType']);
  });

  it('maps decryption_resumed and unencrypted_frame the same way', () => {
    for (const type of [
      'e2ee.decryption_resumed',
      'e2ee.unencrypted_frame',
    ] as const) {
      expect(mapNativeEvent({ ...base, type } as never)).toEqual({
        type,
        payload: { userId: 'alice', trackType: undefined },
      });
    }
  });

  it('keeps missing_key.keyIndex optional, telling the two cases apart', () => {
    // No keyIndex means the local encoder has no key at all; with one, a remote
    // frame named an epoch we do not hold.
    expect(
      mapNativeEvent({ ...base, type: 'e2ee.missing_key' } as never)!.payload,
    ).toEqual({ userId: 'alice', keyIndex: undefined, trackType: undefined });
    expect(
      mapNativeEvent({
        ...base,
        type: 'e2ee.missing_key',
        keyIndex: 7,
        trackType: RTCEncryptionTrackType.AUDIO,
      } as never)!.payload,
    ).toEqual({ userId: 'alice', keyIndex: 7, trackType: 'AUDIO' });
  });

  it('defaults the fields the web payloads require but native leaves optional', () => {
    expect(
      mapNativeEvent({
        ...base,
        type: 'e2ee.decryption_stalled',
      } as never)!.payload,
    ).toEqual({ userId: 'alice', keyIndex: 0, trackType: undefined });
    expect(
      mapNativeEvent({
        ...base,
        type: 'e2ee.encryption_failed',
      } as never)!.payload,
    ).toEqual({ userId: 'alice', reason: '', trackType: undefined });
    expect(
      mapNativeEvent({
        ...base,
        type: 'e2ee.unsupported_version',
      } as never)!.payload,
    ).toEqual({ userId: 'alice', version: 0, trackType: undefined });
  });

  it('passes through the populated failure fields', () => {
    expect(
      mapNativeEvent({
        ...base,
        type: 'e2ee.encryption_failed',
        reason: 'no key',
        trackType: RTCEncryptionTrackType.SCREEN_SHARE,
      } as never)!.payload,
    ).toEqual({ userId: 'alice', reason: 'no key', trackType: 'SCREEN_SHARE' });
    expect(
      mapNativeEvent({
        ...base,
        type: 'e2ee.unsupported_version',
        version: 3,
      } as never)!.payload,
    ).toEqual({ userId: 'alice', version: 3, trackType: undefined });
  });

  it('reshapes perf_report into encode/decode rows', () => {
    const mapped = mapNativeEvent({
      ...base,
      type: 'e2ee.perf_report',
      encode: [
        {
          userId: 'alice',
          trackType: RTCEncryptionTrackType.SCREEN_SHARE_AUDIO,
          codec: 'opus',
          fps: 50,
          maxCryptoMs: 0.3,
        },
      ],
      decode: [
        {
          userId: 'bob',
          trackType: RTCEncryptionTrackType.VIDEO,
          fps: 30,
          maxCryptoMs: 1.2,
        },
      ],
    } as never);
    expect(mapped).toEqual({
      type: 'e2ee.perf_report',
      payload: {
        encode: [
          {
            userId: 'alice',
            trackType: 'SCREEN_SHARE_AUDIO',
            codec: 'opus',
            fps: 50,
            maxCryptoMs: 0.3,
          },
        ],
        decode: [
          { userId: 'bob', trackType: 'VIDEO', fps: 30, maxCryptoMs: 1.2 },
        ],
      },
    });
    // decode rows carry no codec: a remote sender's codec is not known locally
    expect(mapped!.payload).not.toHaveProperty('userId');
    expect(Object.keys((mapped!.payload as any).decode[0])).not.toContain(
      'codec',
    );
  });

  it('defaults missing perf rows and codecs', () => {
    expect(
      mapNativeEvent({ ...base, type: 'e2ee.perf_report' } as never)!.payload,
    ).toEqual({ encode: [], decode: [] });
    const mapped = mapNativeEvent({
      ...base,
      type: 'e2ee.perf_report',
      encode: [
        {
          userId: 'alice',
          trackType: RTCEncryptionTrackType.AUDIO,
          fps: 50,
          maxCryptoMs: 0.1,
        },
      ],
    } as never);
    expect((mapped!.payload as any).encode[0].codec).toBe('');
  });

  it('unwraps key_state, which carries fingerprints only', () => {
    const keyState = {
      perUserKeys: [
        { userId: 'bob', keyIndex: 1, fingerprint: '0123456789abcdef' },
      ],
      sharedKeys: [
        { keyIndex: 0, fingerprint: 'fedcba9876543210', isActive: true },
      ],
    };
    const mapped = mapNativeEvent({
      ...base,
      type: 'e2ee.key_state',
      keyState,
    } as never);
    expect(mapped).toEqual({ type: 'e2ee.key_state', payload: keyState });
    expect(mapped!.payload).not.toHaveProperty('userId');
  });

  it('defaults an empty key_state', () => {
    expect(
      mapNativeEvent({ ...base, type: 'e2ee.key_state' } as never)!.payload,
    ).toEqual({ perUserKeys: [], sharedKeys: [] });
  });

  it('ignores an unrecognized event name', () => {
    expect(
      mapNativeEvent({ ...base, type: 'e2ee.something_new' } as never),
    ).toBeUndefined();
  });
});
