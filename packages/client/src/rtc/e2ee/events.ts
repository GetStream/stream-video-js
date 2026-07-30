/**
 * Throughput sample for one track. `userId` is the local sender on encode, the
 * remote sender on decode. The (userId, trackType) pair keeps a peer's audio
 * and video reported apart instead of summed.
 */
export type TrackPerf = {
  userId: string;
  trackType: string;
  fps: number;
  maxCryptoMs: number;
};

/**
 * Encode entries carry the `codec` the publisher knows; decode entries cannot,
 * since a remote sender's codec is not reliably known locally.
 */
export type PerfReport = {
  encode: (TrackPerf & { codec: string })[];
  decode: TrackPerf[];
};

/**
 * Fired when a needed key is not held. The `keyIndex` tells the two cases apart:
 *
 * - Without it, the local encoder has no key and drops every outgoing frame.
 *   The host never provided a key, or a key import failed.
 * - With it, a remote sender's frame named a key this peer does not hold, so
 *   the frame was dropped. This is normal while a key is in flight, or while a
 *   rotation propagates.
 */
export type MissingKeyEvent = {
  /** The local user, or the remote sender. */
  userId: string;
  /** Decode direction only; absent when the local encoder has no key. */
  keyIndex?: number;
  /**
   * Decode direction only, which reports per track: a peer's tracks can sit on
   * different key epochs, so one may stall while another plays. The encode
   * direction stops every outgoing track at once and is reported per user.
   */
  trackType?: string;
};

/**
 * A remote frame arrived unencrypted and went to the decoder as-is. Expected
 * when the call's mode is `available` and that peer publishes plain; where every
 * peer must encrypt, it means media renders without authentication.
 */
export type UnencryptedFrameEvent = {
  userId: string;
  trackType?: string;
};

/** The worker could not decrypt a remote frame. Throttled per track. */
export type DecryptionFailedEvent = {
  userId: string;
  trackType?: string;
};

/**
 * Fired when a track decrypts again after a reported failure. See
 * {@link E2EEEventMap} for how it pairs with `e2ee.decryption_failed`.
 */
export type DecryptionResumedEvent = {
  userId: string;
  trackType?: string;
};

/**
 * An outgoing frame could not be encrypted, so that track publishes nothing.
 * Latched per track, so a permanently failing track reports once.
 */
export type EncryptionFailedEvent = {
  userId: string;
  /** Only this track is affected; the sender's others keep publishing. */
  trackType?: string;
  /** Short, human-readable reason. */
  reason: string;
};

/**
 * Fired when a remote track passes the internal failure tolerance: decryption
 * has failed on that many consecutive frames.
 */
export type E2EEBrokenEvent = {
  userId: string;
  /** The keyIndex that crossed the tolerance. */
  keyIndex: number;
  trackType?: string;
};

/**
 * Answer to {@link EncryptionManager.requestKeyDump}. `fingerprint` is hex of
 * the first 8 bytes of SHA-256(rawKey): not reversible, so safe to log. Key
 * material is never returned.
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
 * Events that the E2EE {@link EncryptionManager} emits.
 *
 * Subscribe with `manager.on(eventName, handler)`. To unsubscribe, call the
 * function it returns, or `manager.off(eventName, handler)`.
 *
 * Every name follows the `e2ee.<snake_case>` convention. That makes them easy
 * to grep, and keeps them distinct from SFU and coordinator events.
 */
export type E2EEEventMap = {
  /** Key mismatch, rotation in progress, or a tampered frame. */
  'e2ee.decryption_failed': DecryptionFailedEvent;

  /**
   * Pairs one-to-one with `e2ee.decryption_failed` and is never throttled, so a
   * host can drive its UI from the pair alone. Also fires for a track that
   * recovers on a new keyIndex.
   */
  'e2ee.decryption_resumed': DecryptionResumedEvent;

  /** That track is publishing nothing. Latched, so it reports once. */
  'e2ee.encryption_failed': EncryptionFailedEvent;

  /**
   * The host must set or distribute a key. Distinct from
   * `e2ee.encryption_failed`, where a key was present but the crypto threw.
   * Throttled, and stops once the key arrives.
   */
  'e2ee.missing_key': MissingKeyEvent;

  'e2ee.unencrypted_frame': UnencryptedFrameEvent;

  /** Once per second while {@link EncryptionManager.enablePerformanceReporting} is on. */
  'e2ee.perf_report': PerfReport;

  /** Fires once per (userId, keyIndex) entering the failed state. */
  'e2ee.broken': E2EEBrokenEvent;

  /** Answer to {@link EncryptionManager.requestKeyDump}. */
  'e2ee.key_state': KeyStateReport;
};
