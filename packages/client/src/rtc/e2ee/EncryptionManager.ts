import { promiseWithResolvers } from '../../helpers/promise';
import { TypedEventEmitter } from '../../helpers/TypedEventEmitter';
import { type ScopedLogger, videoLoggerSystem } from '../../logger';
import type { E2EEEventMap } from './events';
import type { E2EEManager } from './E2EEManager';

export type {
  E2EEEventMap,
  E2EEBrokenEvent,
  MissingKeyEvent,
  PerfReport,
  RotationEvent,
} from './events';

/**
 * AES-GCM variant used for media frame encryption.
 *
 * - `'AES-128-GCM'` (default) — 16-byte keys. Matches BSI TR-02102-1 §3.2.
 * - `'AES-256-GCM'` — 32-byte keys. Use when a compliance reviewer (e.g. a
 *    KBV Anlage 31b certifier) explicitly requires 256-bit strength.
 */
export type E2EEAlgorithm = 'AES-128-GCM' | 'AES-256-GCM';

type CreateOptions = {
  /** Defaults to `'AES-128-GCM'` */
  algorithm?: E2EEAlgorithm;
  /**
   * Force the legacy Insertable Streams (`createEncodedStreams`) path on
   * Chrome-based browsers instead of the standard `RTCRtpScriptTransform`.
   *
   * Defaults to `false`. Has no effect on browsers that lack
   * `createEncodedStreams` (Firefox/Safari always use `RTCRtpScriptTransform`).
   * Use only as an escape hatch if you hit a Chrome `RTCRtpScriptTransform`
   * regression.
   */
  forceInsertableStreams?: boolean;
};

/**
 * Snapshot of key state returned by {@link EncryptionManager.requestKeyDump}.
 *
 * `fingerprint` is the hex of the first 8 bytes of SHA-256(rawKey) — a
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
 * End-to-end encryption manager for WebRTC media tracks.
 *
 * Handles key distribution to the E2EE Web Worker and attaches
 * encryption/decryption transforms to RTCRtpSenders and RTCRtpReceivers.
 *
 * @example
 * ```ts
 * import { EncryptionManager } from '@stream-io/video-react-sdk';
 *
 * if (EncryptionManager.isSupported()) {
 *   const e2ee = await EncryptionManager.create(call.currentUserId);
 *   call.setE2EEManager(e2ee);
 *   e2ee.setSharedKey(0, rawKeyBytes);
 * }
 * ```
 */
export class EncryptionManager
  extends TypedEventEmitter<E2EEEventMap>
  implements E2EEManager
{
  private readonly logger: ScopedLogger;
  private readonly algorithm: E2EEAlgorithm;
  private readonly forceInsertableStreams: boolean;
  private disposed = false;
  private piped?: WeakSet<RTCRtpSender | RTCRtpReceiver>;

  private pendingKeyDump?: PromiseWithResolvers<KeyStateReport>;

  private readonly userId: string;
  private readonly worker: Worker;
  private readonly workerUrl: string;

  /**
   * Constructs new EncryptionManager instance.
   *
   * @param userId the currentUserId bound to this manager.
   * @param worker the worker implementation to use.
   * @param workerUrl the blob URL to revoke on dispose.
   * @param algorithm the AES-GCM variant expected by this manager.
   * @param forceInsertableStreams force the legacy Insertable Streams path
   *        on Chrome instead of `RTCRtpScriptTransform`.
   */
  private constructor(
    userId: string,
    worker: Worker,
    workerUrl: string,
    algorithm: E2EEAlgorithm,
    forceInsertableStreams: boolean,
  ) {
    super('EncryptionManager');
    this.logger = videoLoggerSystem.getLogger('EncryptionManager');
    this.userId = userId;
    this.worker = worker;
    this.workerUrl = workerUrl;
    this.algorithm = algorithm;
    this.forceInsertableStreams = forceInsertableStreams;
    this.worker.addEventListener('message', this.handleWorkerMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
  }

  /**
   * Check whether the current browser supports WebRTC Encoded Transforms,
   * which are required for E2EE.
   *
   * Use this to guard UI (e.g. hide an "Enable E2EE" toggle) or to
   * avoid calling {@link create} in unsupported environments.
   *
   * @returns `true` if either `RTCRtpScriptTransform` or the legacy
   *          `createEncodedStreams` API is available.
   */
  static isSupported = (): boolean => {
    return (
      typeof RTCRtpScriptTransform !== 'undefined' ||
      (typeof RTCRtpSender !== 'undefined' &&
        'createEncodedStreams' in RTCRtpSender.prototype)
    );
  };

  /**
   * Create an EncryptionManager instance and initialize the E2EE Web Worker.
   *
   * This is async because it dynamically imports the worker module,
   * keeping the ~5 KB worker source out of the main bundle for consumers
   * who don't use E2EE.
   *
   * @param userId - The local user's ID (typically `call.currentUserId`),
   *         used for encryption key lookup when attaching encryptors.
   * @param options - Options that can be used to override certain defaults.
   * @throws {Error} If the browser does not support Encoded Transforms.
   *         Call {@link isSupported} first to check.
   *
   * @example
   * ```ts
   * if (EncryptionManager.isSupported()) {
   *   const e2ee = await EncryptionManager.create(call.currentUserId);
   *   call.setE2EEManager(e2ee);
   *   e2ee.setSharedKey(0, keyBytes);
   * }
   * ```
   *
   * @example Opt into AES-256-GCM (32-byte keys)
   * ```ts
   * const e2ee = await EncryptionManager.create(userId, {
   *   algorithm: 'AES-256-GCM',
   * });
   * ```
   */
  static create = async (
    userId: string,
    options?: CreateOptions,
  ): Promise<EncryptionManager> => {
    if (!EncryptionManager.isSupported()) {
      throw new Error(
        `E2EE is not supported in this browser. Check EncryptionManager.isSupported() before calling create().`,
      );
    }
    const { e2eeWorker } = await import('./e2ee-worker');
    const blob = new Blob([`(${e2eeWorker.toString()})()`], {
      type: 'application/javascript',
    });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, { name: 'stream-video-e2ee' });
    const algorithm = options?.algorithm ?? 'AES-128-GCM';
    const forceInsertableStreams = options?.forceInsertableStreams ?? false;
    return new EncryptionManager(
      userId,
      worker,
      url,
      algorithm,
      forceInsertableStreams,
    );
  };

  /**
   * Terminate the worker and release all resources.
   *
   * After calling this, the manager instance is no longer usable.
   * Call {@link create} to obtain a new one if needed.
   * Safe to call multiple times.
   */
  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.cleanup();
    this.worker.removeEventListener('message', this.handleWorkerMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.terminate();
    URL.revokeObjectURL(this.workerUrl);
    this.removeAllListeners();
  };

  /**
   * Set a per-user AES-GCM encryption key in the worker's key store.
   *
   * Use this when each participant has their own key, distributed by a
   * central authority. The receiver identifies the correct key via the
   * `keyIndex` embedded in each encrypted frame's trailer.
   *
   * @remarks
   * Each call generates a fresh random 8-byte IV prefix on the sender side,
   * which means callers can safely re-import the same raw key material
   * without risking AES-GCM IV reuse. Nevertheless, keys should be rotated
   * (with a new `keyIndex`) when participants join or leave — that's
   * orthogonal to IV uniqueness and is about forward/backward secrecy.
   *
   * @param userId - The user's ID. For per-user keys, this must match the
   *         `trackLookupPrefix` that appears in the remote participant's stream ID
   *         (format: `trackLookupPrefix:TRACK_TYPE_*`). The subscriber uses this
   *         prefix for key lookup during decryption. With shared keys this doesn't
   *         matter since the shared key is used as a fallback for all users.
   * @param keyIndex - Monotonically increasing index for key rotation.
   * @param rawKey - Raw AES key material: 16 bytes for AES-128-GCM (default)
   *         or 32 bytes for AES-256-GCM. Transferred to the worker (zero-copy).
   */
  setKey = (userId: string, keyIndex: number, rawKey: ArrayBuffer): void => {
    this.validateKeyLength(rawKey);
    this.worker.postMessage({ type: 'setKey', userId, keyIndex, rawKey }, [
      rawKey,
    ]);
  };

  /**
   * Set a shared AES-GCM key used as a fallback for any user
   * without a per-user key.
   *
   * This is the simplest E2EE mode: all participants use the same
   * passphrase-derived key. No per-user key distribution needed.
   *
   * @param keyIndex - Key rotation index.
   * @param rawKey - Raw AES key material: 16 bytes for AES-128-GCM (default)
   *         or 32 bytes for AES-256-GCM. Transferred to the worker (zero-copy).
   */
  setSharedKey = (keyIndex: number, rawKey: ArrayBuffer): void => {
    this.validateKeyLength(rawKey);
    this.worker.postMessage({ type: 'setSharedKey', keyIndex, rawKey }, [
      rawKey,
    ]);
  };

  /**
   * Remove all encryption keys for a user from the worker's key store.
   *
   * Call this when a participant leaves the call to revoke their
   * decryption capability for future frames.
   *
   * @param userId - The user's ID whose keys should be removed.
   */
  removeKeys = (userId: string): void => {
    this.worker.postMessage({ type: 'removeKeys', userId });
  };

  /**
   * Attach an encryption transform to an outgoing media track.
   * Called internally by the Publisher when adding a transceiver.
   *
   * @param sender - The RTCRtpSender to encrypt.
   * @param codec - The codec name (e.g. 'vp8', 'h264') for clear-byte rules.
   * @internal
   */
  encrypt = (sender: RTCRtpSender, codec?: string): void => {
    this.pipe(sender, { operation: 'encode', userId: this.userId, codec });
  };

  /**
   * Attach a decryption transform to an incoming media track.
   * Called internally by the Subscriber when a remote track arrives.
   *
   * @param receiver - The RTCRtpReceiver to decrypt.
   * @param userId - The remote user's ID for key lookup in the worker.
   * @internal
   */
  decrypt = (receiver: RTCRtpReceiver, userId: string): void => {
    this.pipe(receiver, { operation: 'decode', userId });
  };

  /**
   * Enable or disable E2EE at runtime.
   *
   * When disabled, the worker passes frames through without
   * encryption/decryption. Transforms remain attached so toggling
   * back on works without reconnecting.
   *
   * @param enabled - Whether E2EE should be active.
   */
  setEnabled = (enabled: boolean): void => {
    this.worker.postMessage({ type: 'e2ee-enabled', enabled });
  };

  /**
   * Pipe a sender/receiver through the worker's transform.
   * Defaults to `RTCRtpScriptTransform`, falling back to the legacy Insertable
   * Streams path; tracks already-piped targets to prevent double-piping.
   */
  private pipe = (
    target: RTCRtpSender | RTCRtpReceiver,
    options: { operation: string; userId: string; codec?: string },
  ): void => {
    if (!this.shouldUseInsertableStreams()) {
      target.transform = new RTCRtpScriptTransform(this.worker, options);
      return;
    }

    if ((this.piped ??= new WeakSet()).has(target)) return;
    this.piped.add(target);
    // @ts-expect-error createEncodedStreams is not in the standard typedefs
    const { readable, writable } = target.createEncodedStreams();
    this.worker.postMessage({ ...options, readable, writable }, [
      readable,
      writable,
    ]);
  };

  /**
   * Decide which Encoded Transform API to attach. Defaults to the standard
   * `RTCRtpScriptTransform` wherever it exists. Falls back to the legacy
   * Insertable Streams (`createEncodedStreams`) path only when
   * `RTCRtpScriptTransform` is unavailable, or when `forceInsertableStreams`
   * opts in on a Chrome-based browser.
   */
  shouldUseInsertableStreams = (): boolean => {
    const hasInsertableStreams =
      typeof RTCRtpSender !== 'undefined' &&
      'createEncodedStreams' in RTCRtpSender.prototype;
    if (this.forceInsertableStreams) return hasInsertableStreams;
    return typeof RTCRtpScriptTransform === 'undefined' && hasInsertableStreams;
  };

  /**
   * Toggle periodic performance reports from the E2EE worker.
   *
   * When enabled, the worker logs encode/decode FPS to the console
   * every second. Useful for debugging throughput issues.
   *
   * @param enabled - Whether to enable or disable perf reporting.
   */
  setPerfReport = (enabled: boolean): void => {
    this.worker.postMessage({ type: 'perf-report', enabled });
  };

  /**
   * Request a snapshot of all keys held by the worker.
   * Returns per-user keys and the shared key (if set) with hex-encoded raw bytes.
   */
  requestKeyDump = (): Promise<KeyStateReport> => {
    if (this.pendingKeyDump) return this.pendingKeyDump.promise;
    this.pendingKeyDump = promiseWithResolvers<KeyStateReport>();
    this.worker.postMessage({ type: 'dumpKeyState' });
    return this.pendingKeyDump.promise;
  };

  /**
   * Clear all keys from the worker and reset internal state.
   */
  private cleanup = (): void => {
    this.worker.postMessage({ type: 'dispose' });
    this.piped = undefined;
  };

  private handleWorkerMessage = (e: MessageEvent) => {
    const { type } = e.data ?? {};
    switch (type) {
      case 'error':
        this.logger.error(e.data.message);
        break;
      case 'e2ee.decryption_failed':
        this.logger.warn(`Decryption failed for user: ${e.data.userId}`);
        this.emit('e2ee.decryption_failed', e.data.userId);
        break;
      case 'e2ee.decryption_resumed':
        this.logger.info(`Decryption resumed for user: ${e.data.userId}`);
        this.emit('e2ee.decryption_resumed', e.data.userId);
        break;
      case 'e2ee.encryption_failed':
        this.logger.error(`Encryption failed: ${e.data.reason}`);
        this.emit('e2ee.encryption_failed', e.data.reason);
        break;
      case 'e2ee.missing_key':
        this.logger.warn(`No encryption key for user: ${e.data.userId}`);
        this.emit('e2ee.missing_key', { userId: e.data.userId });
        break;
      case 'e2ee.rotation_needed':
        this.logger.warn(
          `Rekey requested (counter-threshold) for user: ${e.data.userId}`,
        );
        this.emit('e2ee.rotation_needed', { userId: e.data.userId });
        break;
      case 'e2ee.broken':
        this.logger.error(
          `E2EE broken for user ${e.data.userId} at keyIndex ${e.data.keyIndex}`,
        );
        this.emit('e2ee.broken', {
          userId: e.data.userId,
          keyIndex: e.data.keyIndex,
        });
        break;
      case 'keyState':
        this.pendingKeyDump?.resolve({
          perUserKeys: e.data.perUserKeys,
          sharedKey: e.data.sharedKey,
        });
        this.pendingKeyDump = undefined;
        break;
      case 'e2ee.perf_report':
        this.emit('e2ee.perf_report', {
          encode: e.data.encode,
          decode: e.data.decode,
          decodeMaxCryptoMs: e.data.decodeMaxCryptoMs,
        });
        break;
    }
  };

  private handleWorkerError = (e: ErrorEvent) => {
    this.logger.error('Unhandled worker error:', e.message);
  };

  private validateKeyLength = (rawKey: ArrayBuffer) => {
    const is256 = this.algorithm === 'AES-256-GCM';
    const expected = is256 ? 32 : 16;
    if (rawKey.byteLength !== expected) {
      throw new Error(
        `Key must be exactly ${expected} bytes (${is256 ? 'AES-256' : 'AES-128'})`,
      );
    }
  };
}
