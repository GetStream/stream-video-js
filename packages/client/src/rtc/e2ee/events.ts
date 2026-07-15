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
 * Fired when the local sender's frame counter is approaching the 32-bit
 * ceiling. If ignored, encryption will fail closed at the hard limit.
 */
export type RotationEvent = {
  /** The local sender whose counter is running out. */
  userId: string;
};

/**
 * Fired when the local encoder has no key to encrypt with — the host has not
 * provided one yet, or a key import failed. Outgoing frames are dropped (the
 * sender publishes nothing) until a key is set via `setKey` / `setSharedKey`.
 */
export type MissingKeyEvent = {
  /** The local sender that has no usable key. */
  userId: string;
};

/**
 * Fired when the worker fails to decrypt a frame from a remote participant.
 * Throttled to at most once per second per remote user in the worker.
 */
export type DecryptionFailedEvent = {
  /** Remote user whose frame could not be decrypted. */
  userId: string;
};

/**
 * Fired when decryption resumes for a remote participant after previously
 * reported failures.
 */
export type DecryptionResumedEvent = {
  /** Remote user whose frames decrypt successfully again. */
  userId: string;
};

/**
 * Fired at most once per worker session when an outgoing frame fails to
 * encrypt. When this fires, the sender is effectively publishing nothing.
 */
export type EncryptionFailedEvent = {
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
   * Emitted when decryption resumes successfully for a remote participant
   * after previously reported failures.
   */
  'e2ee.decryption_resumed': DecryptionResumedEvent;

  /**
   * Emitted at most once per worker session if an outgoing frame fails to
   * encrypt. When this fires, the sender is effectively publishing nothing.
   */
  'e2ee.encryption_failed': EncryptionFailedEvent;

  /**
   * Emitted when the encoder has no key for the local user, so outgoing
   * frames are being dropped — the sender is effectively publishing nothing.
   * Distinct from {@link E2EEEventMap}'s `e2ee.encryption_failed`, which means
   * a key was present but the crypto operation threw.
   *
   * The host should set / distribute a key for this user. Throttled to at
   * most once per second per user in the worker, and stops once a key is set.
   */
  'e2ee.missing_key': MissingKeyEvent;

  /**
   * Emitted every second when perf reporting is enabled via
   * {@link EncryptionManager.setPerfReport}.
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
   * Emitted when fresh key material must be distributed — the local sender's
   * frame counter is approaching the 32-bit ceiling. If ignored, encryption
   * will fail closed at the hard limit.
   */
  'e2ee.rotation_needed': RotationEvent;

  /**
   * Emitted in response to {@link EncryptionManager.requestKeyDump}: a
   * snapshot of the keys the worker currently holds (per-user and shared),
   * identified by non-reversible fingerprints. Raw key material is never
   * included.
   */
  'e2ee.key_state': KeyStateReport;
};
