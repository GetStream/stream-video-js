import { isChrome } from '../../helpers/browsers';
import { type ScopedLogger, videoLoggerSystem } from '../../logger';

const validateKeyLength = (rawKey: ArrayBuffer) => {
  if (rawKey.byteLength !== 16) {
    throw new Error(
      `Key must be exactly 16 bytes (AES-128), got ${rawKey.byteLength}`,
    );
  }
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
export class EncryptionManager {
  private readonly logger: ScopedLogger;
  private disposed = false;
  private piped?: WeakSet<RTCRtpSender | RTCRtpReceiver>;

  /**
   * Called when the worker fails to decrypt a frame from a remote participant.
   * This indicates a key mismatch, key rotation in progress, or tampered frame.
   *
   * Throttled to at most once per second per remote user in the worker.
   *
   * @param userId - The remote user's ID whose frames failed to decrypt.
   */
  onDecryptionFailed?: (userId: string) => void;

  private readonly userId: string;
  private readonly worker: Worker;
  private readonly workerUrl: string;

  /**
   * Constructs new EncryptionManager instance.
   *
   * @param userId the currentUserId bound to this manager.
   * @param worker the worker implementation to use.
   * @param workerUrl the blob URL to revoke on dispose.
   */
  private constructor(userId: string, worker: Worker, workerUrl: string) {
    this.logger = videoLoggerSystem.getLogger('EncryptionManager');
    this.userId = userId;
    this.worker = worker;
    this.workerUrl = workerUrl;
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
   */
  static create = async (userId: string): Promise<EncryptionManager> => {
    if (!EncryptionManager.isSupported()) {
      throw new Error(
        'E2EE is not supported in this browser. ' +
          'Check EncryptionManager.isSupported() before calling create().',
      );
    }
    const { WORKER_SOURCE } = await import('./worker');
    const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, { name: 'stream-video-e2ee' });
    return new EncryptionManager(userId, worker, url);
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
  };

  /**
   * Set a per-user AES-128-GCM encryption key in the worker's key store.
   *
   * Use this when each participant has their own key, distributed by a
   * central authority. The receiver identifies the correct key via the
   * `keyIndex` embedded in each encrypted frame's trailer.
   *
   * @param userId - The user's ID. For per-user keys, this must match the
   *         `trackLookupPrefix` that appears in the remote participant's stream ID
   *         (format: `trackLookupPrefix:TRACK_TYPE_*`). The subscriber uses this
   *         prefix for key lookup during decryption. With shared keys this doesn't
   *         matter since the shared key is used as a fallback for all users.
   * @param keyIndex - Monotonically increasing index for key rotation.
   * @param rawKey - 16-byte raw AES-128 key material. Transferred to the worker (zero-copy).
   */
  setKey = (userId: string, keyIndex: number, rawKey: ArrayBuffer): void => {
    validateKeyLength(rawKey);
    this.worker.postMessage({ type: 'setKey', userId, keyIndex, rawKey }, [
      rawKey,
    ]);
  };

  /**
   * Set a shared AES-128-GCM key used as a fallback for any user
   * without a per-user key.
   *
   * This is the simplest E2EE mode: all participants use the same
   * passphrase-derived key. No per-user key distribution needed.
   *
   * @param keyIndex - Key rotation index.
   * @param rawKey - 16-byte raw AES-128 key material. Transferred to the worker (zero-copy).
   */
  setSharedKey = (keyIndex: number, rawKey: ArrayBuffer): void => {
    validateKeyLength(rawKey);
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
    if (codec === 'av1') throw new Error(`AV1 is unsupported`);
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
   * Pipe a sender/receiver through the worker's transform.
   * Handles RTCRtpScriptTransform vs Insertable Streams (Chrome) and
   * tracks already-piped targets to prevent double-piping.
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
   * Chrome exposes RTCRtpScriptTransform but it doesn't work reliably.
   * Prefer the Insertable Streams (createEncodedStreams) path there.
   */
  private shouldUseInsertableStreams = (): boolean => {
    return (
      isChrome() &&
      typeof RTCRtpSender !== 'undefined' &&
      'createEncodedStreams' in RTCRtpSender.prototype
    );
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
    if (type === 'error') {
      this.logger.error(e.data.message);
    } else if (type === 'decryptionFailed') {
      this.logger.warn(`Decryption failed for user: ${e.data.userId}`);
      this.onDecryptionFailed?.(e.data.userId);
    }
  };

  private handleWorkerError = (e: ErrorEvent) => {
    this.logger.error('Unhandled worker error:', e.message);
  };
}
