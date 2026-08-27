import {
  RTCEncryptionAlgorithm,
  RTCEncryptionTrackType,
  type RTCEncryptionEventData,
  type RTCEncryptionTrackPerf,
} from '@stream-io/react-native-webrtc';
import type {
  E2EEAlgorithm,
  E2EEEventMap,
  TrackPerf,
} from '@stream-io/video-client';

/**
 * The core RTC layer labels tracks with the `TrackType` enum *name*
 * (`SfuModels.TrackType[trackType]`), while the native manager takes a numeric
 * enum. Screen-share audio is deliberately its own value: native keeps replay
 * state per (userId, trackType), so folding it into `AUDIO` mis-groups it.
 *
 * These read the native enums inside the function body on purpose. This module
 * is reachable from the SDK's public entry point, so an app whose
 * `@stream-io/react-native-webrtc` predates E2EE would crash on import if the
 * enums were dereferenced at module scope - even if it never touches E2EE.
 */
export const trackTypeToNative = (
  trackType?: string,
): RTCEncryptionTrackType | undefined => {
  switch (trackType) {
    case 'AUDIO':
      return RTCEncryptionTrackType.AUDIO;
    case 'VIDEO':
      return RTCEncryptionTrackType.VIDEO;
    case 'SCREEN_SHARE':
      return RTCEncryptionTrackType.SCREEN_SHARE;
    case 'SCREEN_SHARE_AUDIO':
      return RTCEncryptionTrackType.SCREEN_SHARE_AUDIO;
    default:
      // Native infers audio vs video from the sender rather than pinning a
      // wrong value.
      return undefined;
  }
};

/** Map a native track type back to the name the web events carry. */
export const trackTypeFromNative = (
  trackType?: RTCEncryptionTrackType | number,
): string | undefined => {
  switch (trackType) {
    case RTCEncryptionTrackType.AUDIO:
      return 'AUDIO';
    case RTCEncryptionTrackType.VIDEO:
      return 'VIDEO';
    case RTCEncryptionTrackType.SCREEN_SHARE:
      return 'SCREEN_SHARE';
    case RTCEncryptionTrackType.SCREEN_SHARE_AUDIO:
      return 'SCREEN_SHARE_AUDIO';
    default:
      return undefined;
  }
};

/** Map the public algorithm name to the native enum. */
export const algorithmToNative = (
  algorithm: E2EEAlgorithm,
): RTCEncryptionAlgorithm =>
  algorithm === 'AES-256-GCM'
    ? RTCEncryptionAlgorithm.AES_256_GCM
    : RTCEncryptionAlgorithm.AES_128_GCM;

const toTrackPerf = (row: RTCEncryptionTrackPerf): TrackPerf => ({
  userId: row.userId,
  trackType: trackTypeFromNative(row.trackType) ?? '',
  fps: row.fps,
  maxCryptoMs: row.maxCryptoMs,
});

/**
 * Translate a native event into the payload the web manager emits, so a host
 * can write one set of handlers for both platforms.
 *
 * Two things have to be reshaped rather than passed through: native track types
 * are numeric, and native flattens `managerId`/`type`/`userId` alongside the
 * payload of every event, including the two (`perf_report`, `key_state`) that
 * are not about a single user. Fields the web types require but native leaves
 * optional get an explicit default, so a handler never reads `undefined` where
 * its type promises a value.
 *
 * @returns the mapped event, or `undefined` for an unrecognized event name.
 */
export const mapNativeEvent = <E extends keyof E2EEEventMap>(
  event: RTCEncryptionEventData,
): { type: E; payload: E2EEEventMap[E] } | undefined => {
  const { type, userId, trackType, keyIndex, version, reason } = event;
  const mapped = (payload: E2EEEventMap[keyof E2EEEventMap]) =>
    ({ type, payload }) as { type: E; payload: E2EEEventMap[E] };

  switch (type) {
    case 'e2ee.decryption_failed':
    case 'e2ee.decryption_resumed':
    case 'e2ee.unencrypted_frame':
      return mapped({ userId, trackType: trackTypeFromNative(trackType) });
    case 'e2ee.missing_key':
      return mapped({
        userId,
        keyIndex,
        trackType: trackTypeFromNative(trackType),
      });
    case 'e2ee.decryption_stalled':
      return mapped({
        userId,
        keyIndex: keyIndex ?? 0,
        trackType: trackTypeFromNative(trackType),
      });
    case 'e2ee.encryption_failed':
      return mapped({
        userId,
        trackType: trackTypeFromNative(trackType),
        reason: reason ?? '',
      });
    case 'e2ee.unsupported_version':
      return mapped({
        userId,
        trackType: trackTypeFromNative(trackType),
        version: version ?? 0,
      });
    case 'e2ee.perf_report':
      return mapped({
        encode: (event.encode ?? []).map((row) => ({
          ...toTrackPerf(row),
          codec: row.codec ?? '',
        })),
        decode: (event.decode ?? []).map(toTrackPerf),
      });
    case 'e2ee.key_state':
      return mapped(event.keyState ?? { perUserKeys: [], sharedKeys: [] });
    default:
      return undefined;
  }
};

/** Every event the native manager emits, i.e. what the bridge subscribes to. */
export const E2EE_EVENT_TYPES = [
  'e2ee.decryption_failed',
  'e2ee.decryption_resumed',
  'e2ee.decryption_stalled',
  'e2ee.encryption_failed',
  'e2ee.missing_key',
  'e2ee.unencrypted_frame',
  'e2ee.unsupported_version',
  'e2ee.perf_report',
  'e2ee.key_state',
] as const;
