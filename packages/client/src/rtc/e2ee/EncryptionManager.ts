import { isChrome } from '../../helpers/browsers';
import { TypedEventEmitter } from '../../helpers/TypedEventEmitter';
import { type ScopedLogger, videoLoggerSystem } from '../../logger';
import type { E2EEEventMap } from './events';
import type { E2EEManager } from './E2EEManager';

export type {
  E2EEEventMap,
  E2EEBrokenEvent,
  DecryptionFailedEvent,
  DecryptionResumedEvent,
  EncryptionFailedEvent,
  KeyStateReport,
  MissingKeyEvent,
  PerfReport,
  RotationEvent,
  TrackPerf,
} from './events';

/**
 * Per worker-event logging: severity + a message builder fed the event payload.
 * `null` means "forward without logging" (perf_report / key_state are verbose /
 * high-frequency). This table is the only per-event code in the worker-message
 * path; being keyed by {@link E2EEEventMap} it fails to compile if an event is
 * added without an entry, so the worker contract can't silently drift.
 */
const WORKER_EVENT_LOG: {
  [E in keyof E2EEEventMap]: {
    level: 'error' | 'warn' | 'info';
    message: (payload: E2EEEventMap[E]) => string;
  } | null;
} = {
  'e2ee.decryption_failed': {
    level: 'warn',
    message: (p) => `Decryption failed for user: ${p.userId}`,
  },
  'e2ee.decryption_resumed': {
    level: 'info',
    message: (p) => `Decryption resumed for user: ${p.userId}`,
  },
  'e2ee.encryption_failed': {
    level: 'error',
    message: (p) => `Encryption failed: ${p.reason}`,
  },
  'e2ee.missing_key': {
    level: 'warn',
    message: (p) => `No encryption key for user: ${p.userId}`,
  },
  'e2ee.rotation_needed': {
    level: 'warn',
    message: (p) => `Rekey requested (counter-threshold) for user: ${p.userId}`,
  },
  'e2ee.broken': {
    level: 'error',
    message: (p) =>
      `E2EE broken for user ${p.userId} at keyIndex ${p.keyIndex}`,
  },
  'e2ee.key_state': null,
  'e2ee.perf_report': null,
};

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
   * Opt a Chrome-based browser into the standard `RTCRtpScriptTransform` API
   * instead of the default Insertable Streams (`createEncodedStreams`) path.
   *
   * Defaults to `false`. Chrome ships `RTCRtpScriptTransform` but it's still
   * unreliable there, so the SDK uses Insertable Streams on Chrome regardless
   * of whether `RTCRtpScriptTransform` is available. Set this to `true` only to
   * test or re-enable the standard API on Chrome once it works reliably.
   *
   * Has no effect on Firefox/Safari, which only support `RTCRtpScriptTransform`
   * and always use it.
   */
  forceRtpScriptTransform?: boolean;
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
  private readonly forceRtpScriptTransform: boolean;
  private disposed = false;
  private piped?: WeakSet<RTCRtpSender | RTCRtpReceiver>;

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
   * @param forceRtpScriptTransform opt Chrome into the standard
   *        `RTCRtpScriptTransform` instead of the default Insertable Streams path.
   */
  private constructor(
    userId: string,
    worker: Worker,
    workerUrl: string,
    algorithm: E2EEAlgorithm,
    forceRtpScriptTransform: boolean,
  ) {
    super('EncryptionManager');
    this.logger = videoLoggerSystem.getLogger('EncryptionManager');
    this.userId = userId;
    this.worker = worker;
    this.workerUrl = workerUrl;
    this.algorithm = algorithm;
    this.forceRtpScriptTransform = forceRtpScriptTransform;
    this.worker.addEventListener('message', this.handleWorkerMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
  }

  /**
   * Decide which WebRTC Encoded Transform API the SDK would attach in the
   * current browser, without constructing a manager.
   *
   * This is the canonical selection logic — {@link isSupported} and the
   * instance-level transform attachment both defer to it. Use it to feature
   * detect and preselect a transform path in tooling/UI.
   *
   * - `'insertable'` — the legacy Insertable Streams (`createEncodedStreams`)
   *    path. The default on Chrome, whose `RTCRtpScriptTransform` is still
   *    unreliable for E2EE.
   * - `'script'` — the standard `RTCRtpScriptTransform` API. The default on
   *    Firefox/Safari, and on Chrome when `forceRtpScriptTransform` is set.
   * - `undefined` — neither API is available, so E2EE is unsupported.
   *
   * @param options.forceRtpScriptTransform - Opt a Chrome-based browser onto
   *        the standard `RTCRtpScriptTransform` API. No effect elsewhere.
   */
  static preferredTransform = (options?: {
    forceRtpScriptTransform?: boolean;
  }): 'script' | 'insertable' | undefined => {
    const hasInsertableStreams =
      typeof RTCRtpSender !== 'undefined' &&
      'createEncodedStreams' in RTCRtpSender.prototype;
    const hasScriptTransform = typeof RTCRtpScriptTransform !== 'undefined';
    if (!hasInsertableStreams && !hasScriptTransform) return undefined;

    // Chrome's RTCRtpScriptTransform is still unreliable: default Chrome to the
    // Insertable Streams path unless the caller forces the standard API.
    if (isChrome() && !options?.forceRtpScriptTransform) {
      return hasInsertableStreams ? 'insertable' : 'script';
    }

    // Everywhere else (and Chrome with forceRtpScriptTransform): prefer the
    // standard RTCRtpScriptTransform, falling back to Insertable Streams only
    // when it's unavailable.
    return hasScriptTransform ? 'script' : 'insertable';
  };

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
    return EncryptionManager.preferredTransform() !== undefined;
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
    let worker: Worker;
    try {
      worker = new Worker(url, { name: 'stream-video-e2ee' });
    } catch (err) {
      // e.g. a CSP `worker-src` without `blob:`. Don't leak the object URL.
      URL.revokeObjectURL(url);
      throw err;
    }
    const algorithm = options?.algorithm ?? 'AES-128-GCM';
    const forceRtpScriptTransform = options?.forceRtpScriptTransform ?? false;
    return new EncryptionManager(
      userId,
      worker,
      url,
      algorithm,
      forceRtpScriptTransform,
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
   * @param userId - The key owner's user ID: the local user's `currentUserId`
   *         when storing your own encryption key, or a remote participant's
   *         `userId` when storing a key received from them to decrypt their
   *         media. This is the ID the worker uses for key lookup (the encryptor
   *         looks up the local key by `currentUserId`; the decryptor looks up
   *         each remote participant's key by their `userId`). Irrelevant with a
   *         shared key, which is the fallback for every user.
   * @param keyIndex - Monotonically increasing index for key rotation. Must be
   *         an integer in the range 0-255: the frame trailer carries it in a
   *         single byte, so values outside that range are rejected.
   * @param rawKey - Raw AES key material: 16 bytes for AES-128-GCM (default)
   *         or 32 bytes for AES-256-GCM. Structured-cloned to the worker; the
   *         caller's buffer is not detached and may be re-imported.
   */
  setKey = (userId: string, keyIndex: number, rawKey: ArrayBuffer): void => {
    this.validateKeyIndex(keyIndex);
    this.validateKeyLength(rawKey);
    // Structured-clone the key (no transfer list): transferring would detach
    // the caller's ArrayBuffer, breaking the documented "safe to re-import the
    // same raw key material" contract. The copy of 16/32 bytes is negligible.
    this.worker.postMessage({ type: 'cmd.set_key', userId, keyIndex, rawKey });
  };

  /**
   * Set a shared AES-GCM key used as a fallback for any user
   * without a per-user key.
   *
   * This is the simplest E2EE mode: all participants use the same
   * passphrase-derived key. No per-user key distribution needed.
   *
   * @param keyIndex - Key rotation index. Must be an integer in the range
   *         0-255 (it is carried in a single trailer byte).
   * @param rawKey - Raw AES key material: 16 bytes for AES-128-GCM (default)
   *         or 32 bytes for AES-256-GCM. Structured-cloned to the worker; the
   *         caller's buffer is not detached and may be re-imported.
   */
  setSharedKey = (keyIndex: number, rawKey: ArrayBuffer): void => {
    this.validateKeyIndex(keyIndex);
    this.validateKeyLength(rawKey);
    // Structured-clone (no transfer list) so the caller's buffer is not
    // detached - see setKey.
    this.worker.postMessage({ type: 'cmd.set_shared_key', keyIndex, rawKey });
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
    this.worker.postMessage({ type: 'cmd.remove_keys', userId });
  };

  /**
   * Attach an encryption transform to an outgoing media track.
   * Called internally by the Publisher when adding a transceiver.
   *
   * @param sender - The RTCRtpSender to encrypt.
   * @param codec - The codec name (e.g. 'vp8', 'h264') for clear-byte rules.
   * @param trackType - Optional label used only to bucket encode perf stats.
   * @internal
   */
  encrypt = (
    sender: RTCRtpSender,
    codec?: string,
    trackType?: string,
  ): void => {
    this.pipe(sender, {
      operation: 'encode',
      userId: this.userId,
      codec,
      trackType,
    });
  };

  /**
   * Attach a decryption transform to an incoming media track.
   * Called internally by the Subscriber when a remote track arrives.
   *
   * @param receiver - The RTCRtpReceiver to decrypt.
   * @param userId - The remote user's ID for key lookup in the worker.
   * @param trackType - Optional label used only to bucket decode perf stats.
   * @internal
   */
  decrypt = (
    receiver: RTCRtpReceiver,
    userId: string,
    trackType?: string,
  ): void => {
    this.pipe(receiver, { operation: 'decode', userId, trackType });
  };

  /**
   * Pipe a sender/receiver through the worker's transform.
   * Uses the Insertable Streams path on Chrome and `RTCRtpScriptTransform`
   * elsewhere (see {@link shouldUseInsertableStreams}); tracks already-piped
   * targets to prevent double-piping.
   */
  private pipe = (
    target: RTCRtpSender | RTCRtpReceiver,
    options: {
      operation: string;
      userId: string;
      codec?: string;
      trackType?: string;
    },
  ): void => {
    if (!this.shouldUseInsertableStreams()) {
      target.transform = new RTCRtpScriptTransform(this.worker, options);
      return;
    }

    if ((this.piped ??= new WeakSet()).has(target)) return;
    this.piped.add(target);
    // @ts-expect-error createEncodedStreams is not in the standard typedefs
    const { readable, writable } = target.createEncodedStreams();
    this.worker.postMessage(
      { type: 'cmd.setup_transform', ...options, readable, writable },
      [readable, writable],
    );
  };

  /**
   * Decide whether to attach the legacy Insertable Streams transform for this
   * manager. Defers to {@link preferredTransform} with this manager's
   * `forceRtpScriptTransform` setting.
   */
  shouldUseInsertableStreams = (): boolean => {
    return (
      EncryptionManager.preferredTransform({
        forceRtpScriptTransform: this.forceRtpScriptTransform,
      }) === 'insertable'
    );
  };

  /**
   * Toggle periodic performance reporting from the E2EE worker.
   *
   * When enabled, the worker emits an `e2ee.perf_report` event once per second
   * with per-track encode/decode FPS and crypto timings (subscribe with
   * `manager.on('e2ee.perf_report', handler)`). Useful for debugging throughput.
   *
   * @param enabled - Whether to enable or disable perf reporting.
   */
  enablePerformanceReporting = (enabled: boolean): void => {
    this.worker.postMessage({
      type: 'cmd.enable_performance_reporting',
      enabled,
    });
  };

  /**
   * Request a snapshot of all keys held by the worker.
   *
   * The snapshot is delivered asynchronously via the `e2ee.key_state` event
   * (subscribe with `manager.on('e2ee.key_state', handler)`). Each report lists
   * the per-user keys and the shared key (if set) with non-reversible
   * fingerprints; raw key material is never returned.
   */
  requestKeyDump = (): void => {
    this.worker.postMessage({ type: 'cmd.dump_key_state' });
  };

  /**
   * Clear all keys from the worker and reset internal state.
   */
  private cleanup = (): void => {
    this.worker.postMessage({ type: 'cmd.dispose' });
    this.piped = undefined;
  };

  private handleWorkerMessage = (e: MessageEvent) => {
    const { type, ...payload } = e.data ?? {};
    // `e2ee.error` is a worker-internal log-only channel, never surfaced as an
    // SDK event, so it has no E2EEEventMap entry and is handled separately.
    if (type === 'e2ee.error') {
      this.logger.error(e.data.message);
      return;
    }
    if (!(type in WORKER_EVENT_LOG)) return; // unknown / non-event message
    const event = type as keyof E2EEEventMap;
    const log = WORKER_EVENT_LOG[event];
    if (log)
      this.logger[log.level]((log.message as (p: any) => string)(payload));
    // The worker posts each notification already shaped as its event-map
    // payload, so the rest of the message forwards verbatim. WORKER_EVENT_LOG is
    // keyed by E2EEEventMap, so a new event won't compile without an entry here.
    this.emit(event, payload as never);
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

  /**
   * The frame trailer carries the keyIndex in a single byte, so the wire format
   * caps it at 255. A larger value would be truncated to `keyIndex & 0xFF`, and
   * the receiver would look up the wrong key (or key 0) and fail every decrypt.
   * Reject it at the boundary instead of shipping a silently-broken key epoch.
   */
  private validateKeyIndex = (keyIndex: number) => {
    if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex > 255) {
      throw new Error(
        `keyIndex must be an integer between 0 and 255, got ${keyIndex}`,
      );
    }
  };
}
