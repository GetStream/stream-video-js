import { preferredTransform } from './transformSupport';
import { TypedEventEmitter } from '../../helpers/TypedEventEmitter';
import type { E2EEEventMap } from './events';
import type { E2EEManager } from './E2EEManager';

export type {
  E2EEEventMap,
  DecryptionFailedEvent,
  DecryptionResumedEvent,
  DecryptionStalledEvent,
  EncryptionFailedEvent,
  KeyStateReport,
  MissingKeyEvent,
  PerfReport,
  TrackPerf,
  UnencryptedFrameEvent,
  UnsupportedVersionEvent,
} from './events';

/**
 * - `'AES-128-GCM'` (default): 16-byte keys, per BSI TR-02102-1 §3.2.
 * - `'AES-256-GCM'`: 32-byte keys. For a compliance reviewer that requires
 *   256-bit strength, such as a KBV Anlage 31b certifier.
 */
export type E2EEAlgorithm = 'AES-128-GCM' | 'AES-256-GCM';

/** Options for {@link EncryptionManager.create}. */
export type EncryptionManagerOptions = {
  algorithm?: E2EEAlgorithm;
};

/**
 * Distributes keys to the E2EE Web Worker and attaches encrypt/decrypt
 * transforms to RTCRtpSenders and RTCRtpReceivers.
 */
export class EncryptionManager
  extends TypedEventEmitter<E2EEEventMap>
  implements E2EEManager
{
  private readonly algorithm: E2EEAlgorithm;
  private readonly transform: 'script' | 'insertable';
  private disposed = false;
  private piped?: WeakSet<RTCRtpSender | RTCRtpReceiver>;

  private readonly userId: string;
  private readonly worker: Worker;
  private readonly workerUrl: string;

  private constructor(
    userId: string,
    worker: Worker,
    workerUrl: string,
    algorithm: E2EEAlgorithm,
    transform: 'script' | 'insertable',
  ) {
    super('EncryptionManager');
    this.userId = userId;
    this.worker = worker;
    this.workerUrl = workerUrl;
    this.algorithm = algorithm;
    this.transform = transform;
    this.worker.addEventListener('message', this.handleWorkerMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
  }

  /**
   * Whether this browser has WebRTC Encoded Transforms, which E2EE requires.
   * Use it to guard UI, or to avoid calling {@link create} where it would throw.
   */
  static isSupported = (): boolean => {
    return preferredTransform() !== undefined;
  };

  /**
   * Create an EncryptionManager instance and initialize the E2EE Web Worker.
   *
   * @param userId - The local user's ID, normally `call.currentUserId`.
   * @param options - the create options.
   * @throws {Error} If the browser lacks Encoded Transforms.
   *
   * @example
   * ```ts
   * if (EncryptionManager.isSupported()) {
   *   const e2ee = await EncryptionManager.create(call.currentUserId);
   *   call.setE2EEManager(e2ee);
   *   e2ee.setSharedKey(0, keyBytes);
   * }
   */
  static create = async (
    userId: string,
    options?: EncryptionManagerOptions,
  ): Promise<EncryptionManager> => {
    const transform = preferredTransform();
    if (!transform) {
      throw new Error(`E2EE is not supported in this browser`);
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
    return new EncryptionManager(userId, worker, url, algorithm, transform);
  };

  /**
   * {@link dispose} terminates the worker, so `postMessage` becomes a silent
   * no-op and an attached transform points at a dead worker: frames would stall
   * forever with no error and no event. Throwing is also fail-closed, since a
   * caller that swallows it still publishes nothing rather than cleartext.
   */
  private assertUsable = () => {
    if (this.disposed) throw new Error(`EncryptionManager is disposed`);
  };

  /**
   * Terminate the worker and release all resources.
   *
   * The manager is unusable afterwards and every other method throws. Call
   * {@link create} for a new one. Safe to call more than once.
   */
  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.piped = undefined;
    this.worker.removeEventListener('message', this.handleWorkerMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.terminate();
    URL.revokeObjectURL(this.workerUrl);
    this.removeAllListeners();
  };

  /**
   * Set a per-user AES-GCM encryption key in the worker's key store.
   *
   * Use it when each participant has their own key from a central authority.
   * The receiver picks the right one by the `keyIndex` in the frame trailer.
   *
   * @param userId - The key owner.
   * @param keyIndex - Increases with each rotation.
   * @param rawKey - 16 bytes for AES-128-GCM, 32 for AES-256-GCM.
   */
  setKey = (userId: string, keyIndex: number, rawKey: ArrayBuffer): void => {
    this.assertUsable();
    this.validateKeyIndex(keyIndex);
    this.validateKeyLength(rawKey);
    this.worker.postMessage({ type: 'cmd.set_key', userId, keyIndex, rawKey });
  };

  /**
   * Fallback key for any user without a per-user key. The simplest E2EE mode:
   * one key for everyone, usually passphrase-derived, no distribution needed.
   * Setting an epoch makes it active for encryption while older epochs remain
   * available to decrypt in-flight frames until {@link removeSharedKey}.
   *
   * @param keyIndex - An integer 0-255, since one trailer byte carries it.
   * @param rawKey - 16 bytes for AES-128-GCM, 32 for AES-256-GCM.
   */
  setSharedKey = (keyIndex: number, rawKey: ArrayBuffer): void => {
    this.assertUsable();
    this.validateKeyIndex(keyIndex);
    this.validateKeyLength(rawKey);
    this.worker.postMessage({ type: 'cmd.set_shared_key', keyIndex, rawKey });
  };

  /**
   * Remove one shared-key epoch from the worker's receive key ring.
   *
   * If this is the active epoch, shared-key encryption stops until
   * {@link setSharedKey} succeeds again. An older epoch is not reactivated.
   *
   * @param keyIndex - The exact shared-key epoch to remove.
   */
  removeSharedKey = (keyIndex: number): void => {
    this.assertUsable();
    this.validateKeyIndex(keyIndex);
    this.worker.postMessage({ type: 'cmd.remove_shared_key', keyIndex });
  };

  /**
   * Retire one of a user's key epochs, leaving their other epochs usable.
   *
   * @param userId - The key owner.
   * @param keyIndex - The exact epoch to remove. Absent epochs are a no-op.
   */
  removeKey = (userId: string, keyIndex: number): void => {
    this.assertUsable();
    this.validateKeyIndex(keyIndex);
    this.worker.postMessage({ type: 'cmd.remove_key', userId, keyIndex });
  };

  /**
   * Drop every key a user holds, revoking their ability to decrypt later
   * frames. Call it when a participant leaves.
   *
   * To retire one rotated epoch instead, use {@link removeKey}.
   */
  removeAllKeys = (userId: string): void => {
    this.assertUsable();
    this.worker.postMessage({ type: 'cmd.remove_all_keys', userId });
  };

  /**
   * Called by the Publisher when it adds a transceiver.
   *
   * @param sender - The sender to encrypt.
   * @param codec - Codec name, e.g. 'vp8', selecting the clear-byte rules.
   * @param trackType - Optional label; only groups perf stats.
   * @internal
   */
  encrypt = (
    sender: RTCRtpSender,
    codec?: string,
    trackType?: string,
  ): void => {
    this.assertUsable();
    this.pipe(sender, {
      operation: 'encode',
      userId: this.userId,
      codec,
      trackType,
    });
  };

  /**
   * Called by the Subscriber when a remote track arrives.
   *
   * @param receiver - The receiver to decrypt.
   * @param userId - The remote user, for key lookup in the worker.
   * @param trackType - Optional label; only groups perf stats.
   * @internal
   */
  decrypt = (
    receiver: RTCRtpReceiver,
    userId: string,
    trackType?: string,
  ): void => {
    this.assertUsable();
    this.pipe(receiver, { operation: 'decode', userId, trackType });
  };

  /** Pipe through the worker's transform, tracking targets to avoid double-piping. */
  private pipe = (
    target: RTCRtpSender | RTCRtpReceiver,
    options: {
      operation: string;
      userId: string;
      codec?: string;
      trackType?: string;
    },
  ): void => {
    if (this.transform === 'script') {
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
   * Toggle periodic performance reporting from the E2EE worker.
   *
   * While on, the worker emits `e2ee.perf_report` once per second with per-track
   * FPS and crypto timings. Useful for debugging throughput.
   */
  enablePerformanceReporting = (enabled: boolean): void => {
    this.assertUsable();
    this.worker.postMessage({
      type: 'cmd.enable_performance_reporting',
      enabled,
    });
  };

  /**
   * Request a snapshot of the worker's keys. It arrives later as the
   * `e2ee.key_state` event, listing fingerprints only, never key material.
   */
  requestKeyState = (): void => {
    this.assertUsable();
    this.worker.postMessage({ type: 'cmd.request_key_state' });
  };

  private handleWorkerMessage = (e: MessageEvent) => {
    const { type, ...payload } = e.data ?? {};
    if (type === 'e2ee.error') {
      this.logger.error(e.data.message);
      return;
    }
    const event = type as keyof E2EEEventMap;
    this.logger.debug('Dispatching', event, payload);

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
   * One trailer byte carries the keyIndex. A larger value would truncate to
   * `keyIndex & 0xFF`, so the receiver would look up the wrong key and fail
   * every decrypt. Reject it rather than ship a silently broken key epoch.
   */
  private validateKeyIndex = (keyIndex: number) => {
    if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex > 255) {
      throw new Error(
        `keyIndex must be an integer between 0 and 255, got ${keyIndex}`,
      );
    }
  };
}
