/**
 * Per-track throughput sample. For encode `userId` is the local sender; for
 * decode it is the remote sender. `trackType` is VIDEO / SCREEN_SHARE / AUDIO.
 * Bucketing per (userId, trackType) keeps a peer's - or the local sender's -
 * audio and video reported apart instead of summed into one figure.
 */
export type TrackPerf = {
  userId: string;
  trackType: string;
  fps: number;
  maxCryptoMs: number;
};

/**
 * Perf report payload emitted by the E2EE worker. Encode entries additionally
 * carry the `codec` (known when publishing); decode entries do not, since the
 * remote sender's codec is not reliably known locally.
 */
export type PerfReport = {
  encode: (TrackPerf & { codec: string })[];
  decode: TrackPerf[];
};

/**
 * Fired when a key that is needed is not held:
 * - without `keyIndex`, the local encoder has no key to encrypt with (the host
 *   never provided one, or a key import failed) and outgoing frames are dropped;
 * - with `keyIndex`, a remote sender's frame referenced a key at that index that
 *   this peer does not hold, so the frame was dropped. Normal while a key is
 *   still in flight or a rotation has not propagated yet.
 */
export type MissingKeyEvent = {
  /** The sender whose key is missing: the local user, or the remote sender. */
  userId: string;
  /**
   * The keyIndex the remote frame asked for. Present only for the decode
   * direction; absent when the local encoder has no key at all.
   */
  keyIndex?: number;
  /**
   * The stalled track (VIDEO / AUDIO / SCREEN_SHARE). Present only for the
   * decode direction, which reports per track: two of a peer's tracks can be on
   * different key epochs, so one may stall while the other plays. The encode
   * direction has no track: the local user holds no key at all, which stops
   * every outgoing track at once, and is reported once for the user.
   */
  trackType?: string;
};

/**
 * Fired when a frame from a remote participant arrives unencrypted and is
 * forwarded to the decoder as-is. Expected when the call's encryption mode is
 * `available` and that peer publishes plain; on a call where every peer is meant
 * to encrypt it means media is being rendered without authentication.
 * Throttled to at most once per second per remote track in the worker.
 */
export type UnencryptedFrameEvent = {
  /** Remote user whose frame carried no E2EE framing. */
  userId: string;
  /** The track arriving in the clear (VIDEO / AUDIO / SCREEN_SHARE). */
  trackType?: string;
};

/**
 * Fired when the worker fails to decrypt a frame from a remote participant.
 * Throttled to at most once per second per remote user in the worker.
 */
export type DecryptionFailedEvent = {
  /** Remote user whose frame could not be decrypted. */
  userId: string;
  /** The failing track (VIDEO / AUDIO / SCREEN_SHARE), tracked per track. */
  trackType?: string;
};

/**
 * Fired when decryption resumes for a remote participant after previously
 * reported failures.
 */
export type DecryptionResumedEvent = {
  /** Remote user whose frames decrypt successfully again. */
  userId: string;
  /** The recovered track. */
  trackType?: string;
};

/**
 * Fired when an outgoing frame fails to encrypt. When this fires, that track is
 * publishing nothing. Latched per track: it fires on the first failure of a run
 * and stays quiet until a frame encrypts again, so a permanently failing track
 * reports once rather than once per frame.
 */
export type EncryptionFailedEvent = {
  /** The local sender. */
  userId: string;
  /**
   * The track that stopped publishing (VIDEO / AUDIO / SCREEN_SHARE). A sender
   * usually has several, and only the named one is affected - a codec the
   * worker cannot split, for example, takes down that track alone.
   */
  trackType?: string;
  /** Short, human-readable reason the encrypt failed. */
  reason: string;
};

/**
 * Fired when the SDK detects that the E2EE session is broken for a remote
 * user — decryption has failed repeatedly past the internal tolerance.
 */
export type E2EEBrokenEvent = {
  /** Remote user whose frames can no longer be decrypted. */
  userId: string;
  /** The keyIndex that crossed the failure tolerance. */
  keyIndex: number;
  /** The broken track. */
  trackType?: string;
};

/**
 * Snapshot of key state delivered via the `e2ee.key_state` event in response
 * to {@link EncryptionManager.requestKeyDump}.
 *
 * `fingerprint` is the hex of the first 8 bytes of SHA-256(rawKey), a
 * non-reversible identifier safe to log. Raw key material is never returned.
 */
export type KeyStateReport = {
  perUserKeys: Array<{
    userId: string;
    keyIndex: number;
    fingerprint: string;
  }>;
  sharedKey: { keyIndex: number; fingerprint: string } | null;
};

/**
 * Events emitted by the E2EE {@link EncryptionManager}.
 *
 * Subscribe with `manager.on(eventName, handler)` / unsubscribe via the
 * returned function or `manager.off(eventName, handler)`.
 *
 * Event names use the `e2ee.<snake_case>` convention so they are easy to
 * grep across the codebase and to distinguish from SFU / coordinator events.
 */
export type E2EEEventMap = {
  /**
   * Emitted when the worker fails to decrypt a frame from a remote participant.
   * Indicates a key mismatch, a rotation in progress, or a tampered frame.
   * Throttled to at most once per second per remote user in the worker.
   */
  'e2ee.decryption_failed': DecryptionFailedEvent;

  /**
   * Emitted when decryption resumes on a track that previously reported
   * `e2ee.decryption_failed`. Paired one-to-one with that event and never
   * throttled, so a delivered failure is always followed by its recovery and a
   * host can drive UI straight off the pair. Fires for a track that recovers by
   * rotating to a new keyIndex too, not only for one whose original key starts
   * working again.
   */
  'e2ee.decryption_resumed': DecryptionResumedEvent;

  /**
   * Emitted when an outgoing frame fails to encrypt: that track is publishing
   * nothing. Latched per track, so a permanently failing track reports once
   * rather than once per frame.
   */
  'e2ee.encryption_failed': EncryptionFailedEvent;

  /**
   * Emitted when a needed key is not held. Without `keyIndex`, the encoder has
   * no key for the local user, so outgoing frames are being dropped — the sender
   * is effectively publishing nothing. With `keyIndex`, a remote sender's frame
   * referenced a key this peer does not hold and was dropped; that is the normal
   * state while key distribution or a rotation is still in flight, which is why
   * it is not reported as `e2ee.decryption_failed`.
   *
   * Distinct from `e2ee.encryption_failed`, which means a key was present but
   * the crypto operation threw. The host should set / distribute a key. Throttled
   * in the worker and stops once the key arrives.
   */
  'e2ee.missing_key': MissingKeyEvent;

  /**
   * Emitted when a remote frame arrives unencrypted and is forwarded to the
   * decoder as-is.
   */
  'e2ee.unencrypted_frame': UnencryptedFrameEvent;

  /**
   * Emitted every second when perf reporting is enabled via
   * {@link EncryptionManager.enablePerformanceReporting}.
   */
  'e2ee.perf_report': PerfReport;

  /**
   * Emitted when the SDK detects that the E2EE session is broken for a
   * remote user — decryption has failed repeatedly past the internal
   * tolerance. Fires once per (userId, keyIndex) transition into the
   * invalid state.
   */
  'e2ee.broken': E2EEBrokenEvent;

  /**
   * Emitted in response to {@link EncryptionManager.requestKeyDump}: a
   * snapshot of the keys the worker currently holds (per-user and shared),
   * identified by non-reversible fingerprints. Raw key material is never
   * included.
   */
  'e2ee.key_state': KeyStateReport;
};
