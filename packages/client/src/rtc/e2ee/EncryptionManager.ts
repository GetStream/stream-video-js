import { preferredTransform } from './transformSupport';
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
  TrackPerf,
  UnencryptedFrameEvent,
} from './events';

/**
 * - `'AES-128-GCM'` (default): 16-byte keys, per BSI TR-02102-1 §3.2.
 * - `'AES-256-GCM'`: 32-byte keys. For a compliance reviewer that requires
 *   256-bit strength, such as a KBV Anlage 31b certifier.
 */
export type E2EEAlgorithm = 'AES-128-GCM' | 'AES-256-GCM';

type CreateOptions = {
  algorithm?: E2EEAlgorithm;
  /**
   * Put Chrome on the standard `RTCRtpScriptTransform` instead of Insertable
   * Streams. Chrome ships it but it is still unreliable, so the SDK defaults to
   * Insertable Streams there. Set it to test or re-enable the standard API once
   * it works. No effect on Firefox and Safari, which only have the standard one.
   */
  forceRtpScriptTransform?: boolean;
};

/**
 * Distributes keys to the E2EE Web Worker and attaches encrypt/decrypt
 * transforms to RTCRtpSenders and RTCRtpReceivers.
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
  private readonly transform: 'script' | 'insertable';
  private disposed = false;
  private piped?: WeakSet<RTCRtpSender | RTCRtpReceiver>;

  private readonly userId: string;
  private readonly worker: Worker;
  private readonly workerUrl: string;

  /** @param workerUrl the blob URL to revoke on dispose. */
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
    this.transform =
      preferredTransform({ forceRtpScriptTransform }) ?? 'script';
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
   * Async because it imports the worker module dynamically, keeping the worker
   * source out of the main bundle for consumers who do not use E2EE.
   *
   * @param userId - The local user's ID, normally `call.currentUserId`. The
   *         encryptor looks its key up by this.
   * @throws {Error} If the browser lacks Encoded Transforms. Check
   *         {@link isSupported} first.
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
   * {@link dispose} terminates the worker, so `postMessage` becomes a silent
   * no-op and an attached transform points at a dead worker: frames would stall
   * forever with no error and no event. Throwing is also fail-closed, since a
   * caller that swallows it still publishes nothing rather than cleartext.
   */
  private assertUsable = (operation: string) => {
    if (this.disposed) {
      throw new Error(`EncryptionManager.${operation} called after dispose()`);
    }
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
   * Use it when each participant has their own key from a central authority.
   * The receiver picks the right one by the `keyIndex` in the frame trailer.
   *
   * @remarks
   * Each call makes a fresh random IV prefix, so the same raw key can be
   * imported again without IV reuse. Rotate on join and leave anyway: that is
   * forward and backward secrecy, a separate concern.
   *
   * @param userId - The key owner. Pass `currentUserId` for your own key, or a
   *         remote participant's `userId` for one you received from them.
   * @param keyIndex - Increases with each rotation. An integer 0-255, since one
   *         trailer byte carries it.
   * @param rawKey - 16 bytes for AES-128-GCM, 32 for AES-256-GCM. Cloned, not
   *         transferred, so the caller's buffer stays usable.
   */
  setKey = (userId: string, keyIndex: number, rawKey: ArrayBuffer): void => {
    this.assertUsable('setKey');
    this.validateKeyIndex(keyIndex);
    this.validateKeyLength(rawKey);
    // No transfer list: a transfer would detach the caller's ArrayBuffer and
    // break the documented re-import contract. Copying 32 bytes is cheap.
    this.worker.postMessage({ type: 'cmd.set_key', userId, keyIndex, rawKey });
  };

  /**
   * Fallback key for any user without a per-user key. The simplest E2EE mode:
   * one key for everyone, usually passphrase-derived, no distribution needed.
   *
   * @param keyIndex - An integer 0-255, since one trailer byte carries it.
   * @param rawKey - 16 bytes for AES-128-GCM, 32 for AES-256-GCM. Cloned, not
   *         transferred, so the caller's buffer stays usable.
   */
  setSharedKey = (keyIndex: number, rawKey: ArrayBuffer): void => {
    this.assertUsable('setSharedKey');
    this.validateKeyIndex(keyIndex);
    this.validateKeyLength(rawKey);
    // No transfer list; see setKey.
    this.worker.postMessage({ type: 'cmd.set_shared_key', keyIndex, rawKey });
  };

  /**
   * Drop a user's keys, revoking their ability to decrypt later frames. Call it
   * when a participant leaves.
   */
  removeKeys = (userId: string): void => {
    this.assertUsable('removeKeys');
    this.worker.postMessage({ type: 'cmd.remove_keys', userId });
  };

  /**
   * Called by the Publisher when it adds a transceiver.
   *
   * @param codec - Codec name, e.g. 'vp8', selecting the clear-byte rules.
   * @param trackType - Optional label; only groups perf stats.
   * @internal
   */
  encrypt = (
    sender: RTCRtpSender,
    codec?: string,
    trackType?: string,
  ): void => {
    this.assertUsable('encrypt');
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
   * @param userId - The remote user, for key lookup in the worker.
   * @param trackType - Optional label; only groups perf stats.
   * @internal
   */
  decrypt = (
    receiver: RTCRtpReceiver,
    userId: string,
    trackType?: string,
  ): void => {
    this.assertUsable('decrypt');
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
    this.assertUsable('enablePerformanceReporting');
    this.worker.postMessage({
      type: 'cmd.enable_performance_reporting',
      enabled,
    });
  };

  /**
   * Request a snapshot of the worker's keys. It arrives later as the
   * `e2ee.key_state` event, listing fingerprints only, never key material.
   */
  requestKeyDump = (): void => {
    this.assertUsable('requestKeyDump');
    this.worker.postMessage({ type: 'cmd.dump_key_state' });
  };

  private cleanup = (): void => {
    this.worker.postMessage({ type: 'cmd.dispose' });
    this.piped = undefined;
  };

  private handleWorkerMessage = (e: MessageEvent) => {
    const { type, ...payload } = e.data ?? {};
    // Internal log-only channel: no E2EEEventMap entry, so handle it here.
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
        `Key must be exactly ${expected} bytes (${
          is256 ? 'AES-256' : 'AES-128'
        })`,
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
