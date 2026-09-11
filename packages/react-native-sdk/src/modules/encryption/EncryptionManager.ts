import {
  RTCEncryptionManager,
  type RTCEncryptionEventData,
  type RTCEncryptionEventType,
} from '@stream-io/react-native-webrtc';
import {
  TypedEventEmitter,
  videoLoggerSystem,
  type E2EEAlgorithm,
  type E2EEEventMap,
  type E2EEManager,
  type EncryptionManagerOptions,
  type Listener,
  type ScopedLogger,
} from '@stream-io/video-client';
import {
  algorithmToNative,
  E2EE_EVENT_TYPES,
  mapNativeEvent,
  trackTypeToNative,
} from './eventMapping';

/**
 * Distributes keys to the native encryption manager and attaches
 * encrypt/decrypt transforms to RTCRtpSenders and RTCRtpReceivers.
 *
 * The public surface matches the web
 * {@link https://github.com/GetStream/stream-video-js/blob/main/packages/client/src/rtc/e2ee/EncryptionManager.ts | EncryptionManager}
 * method for method, so host code is portable between the two SDKs.
 *
 * The crypto itself lives in the WebRTC binary, not here: frames never cross
 * the React Native bridge. This class carries key and attach commands over it,
 * and diagnostic events back.
 *
 * Like the keys it installs, the manager is application-owned: create one per
 * call, attach it before {@link https://github.com/GetStream/stream-video-js/blob/main/packages/client/src/Call.ts | Call}`.join()`,
 * and {@link EncryptionManager.dispose | dispose} it when that call is done.
 * Nothing in the SDK will do it for you, and on React Native the leak is native
 * rather than collectable.
 *
 * @example
 * ```ts
 * if (EncryptionManager.isSupported()) {
 *   const e2ee = await EncryptionManager.create(call.currentUserId);
 *   e2ee.setSharedKey(0, keyBytes);
 *   call.setE2EEManager(e2ee); // must happen before call.join()
 * }
 * ```
 */
export class EncryptionManager implements E2EEManager {
  private readonly algorithm: E2EEAlgorithm;
  private readonly native: RTCEncryptionManager;
  private readonly events: TypedEventEmitter<E2EEEventMap>;
  private readonly logger: ScopedLogger;
  private readonly bridged: Array<
    [RTCEncryptionEventType, (data: RTCEncryptionEventData) => void]
  > = [];
  private disposed = false;

  private constructor(native: RTCEncryptionManager, algorithm: E2EEAlgorithm) {
    this.native = native;
    this.algorithm = algorithm;
    this.logger = videoLoggerSystem.getLogger('EncryptionManager');
    this.events = new TypedEventEmitter<E2EEEventMap>(this.logger);
    // Native dispatches per event name, so the one handler is registered under
    // each of them, and each registration has to be undone on dispose.
    for (const type of E2EE_EVENT_TYPES) {
      this.native.on(type, this.handleNativeEvent);
      this.bridged.push([type, this.handleNativeEvent]);
    }
  }

  private handleNativeEvent = (data: RTCEncryptionEventData) => {
    const event = mapNativeEvent(data);
    if (!event) return;
    this.events.emit(event.type, event.payload);
  };

  /**
   * Whether E2EE can run here. Use it to guard UI, or to avoid calling
   * {@link create} where it would throw.
   *
   * `false` means the installed `@stream-io/react-native-webrtc` predates E2EE
   * support.
   */
  static isSupported = (): boolean =>
    RTCEncryptionManager?.isSupported() ?? false;

  /**
   * Create an EncryptionManager and initialize the underlying native manager.
   *
   * Attach it with `call.setE2EEManager()` **before** `call.join()`: the join
   * request carries the E2EE flag, and the peer connections are built with the
   * transforms in place.
   *
   * Resolves rather than returning directly because every Stream SDK exposes
   * this as a promise; nothing here is actually asynchronous, since a blocking
   * native create is what keeps a sender from ever existing unencrypted.
   *
   * @param userId - The local user's ID, normally `call.currentUserId`.
   * @param options - the create options.
   * @throws {Error} If E2EE is unavailable. It never degrades to plaintext.
   */
  static create = async (
    userId: string,
    options?: EncryptionManagerOptions,
  ): Promise<EncryptionManager> => {
    if (!RTCEncryptionManager) {
      throw new Error(
        'E2EE requires a version of @stream-io/react-native-webrtc that supports RTCEncryptionManager',
      );
    }
    if (!RTCEncryptionManager.isSupported()) {
      throw new Error('E2EE is not supported on this device');
    }
    const algorithm = options?.algorithm ?? 'AES-128-GCM';
    const native = RTCEncryptionManager.create(userId, {
      algorithm: algorithmToNative(algorithm),
    });
    return new EncryptionManager(native, algorithm);
  };

  /**
   * Subscribe to an E2EE event.
   *
   * @returns a function that unsubscribes the listener.
   */
  on = <E extends keyof E2EEEventMap>(
    event: E,
    fn: Listener<E2EEEventMap[E]>,
  ): (() => void) => this.events.on(event, fn);

  /** Unsubscribe a listener registered with {@link on}. */
  off = <E extends keyof E2EEEventMap>(
    event: E,
    fn: Listener<E2EEEventMap[E]>,
  ): void => this.events.off(event, fn);

  /** Drop every listener, or every listener of one event. */
  removeAllListeners = (event?: keyof E2EEEventMap): void =>
    this.events.removeAllListeners(event);

  /**
   * Set a per-user AES-GCM encryption key in the native key store.
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
    this.native.setKey(userId, keyIndex, this.copyKey(rawKey));
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
    this.native.setSharedKey(keyIndex, this.copyKey(rawKey));
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
    this.native.removeKey(userId, keyIndex);
  };

  /**
   * Drop every key a user holds from the local key store, so later frames of
   * theirs no longer decrypt.
   *
   * This is local cleanup, not remote revocation: it cannot stop that
   * participant from decrypting anything, and a shared key still decrypts them.
   * Revoking access means withholding future keys, which the application owns.
   *
   * To retire one rotated epoch instead, use {@link removeKey}.
   */
  removeAllKeys = (userId: string): void => {
    this.assertUsable();
    this.native.removeAllKeys(userId);
  };

  /**
   * Remove one shared-key epoch from the native receive key ring.
   *
   * If this is the active epoch, shared-key encryption stops until
   * {@link setSharedKey} succeeds again. An older epoch is not reactivated.
   *
   * @param keyIndex - The exact shared-key epoch to remove.
   */
  removeSharedKey = (keyIndex: number): void => {
    this.assertUsable();
    this.validateKeyIndex(keyIndex);
    this.native.removeSharedKey(keyIndex);
  };

  /**
   * Called by the Publisher when it adds a transceiver.
   *
   * Synchronous all the way to the native `SetFrameTransformer` call: were it
   * async, the sender would exist before its transform did, which is a
   * plaintext window. A failure throws instead of publishing cleartext.
   *
   * @param sender - The sender to encrypt.
   * @param codec - Codec name, e.g. 'vp8', selecting the clear-byte rules.
   * @param trackType - `TrackType` enum name, e.g. 'SCREEN_SHARE_AUDIO'.
   * @internal
   */
  encrypt = (
    sender: RTCRtpSender,
    codec?: string,
    trackType?: string,
  ): void => {
    this.assertUsable();
    this.native.encrypt(sender as never, codec, trackTypeToNative(trackType));
  };

  /**
   * Called by the Subscriber when a remote track arrives.
   *
   * @param receiver - The receiver to decrypt.
   * @param userId - The remote user, for key lookup.
   * @param trackType - `TrackType` enum name, e.g. 'SCREEN_SHARE_AUDIO'.
   * @internal
   */
  decrypt = (
    receiver: RTCRtpReceiver,
    userId: string,
    trackType?: string,
  ): void => {
    this.assertUsable();
    this.native.decrypt(
      receiver as never,
      userId,
      trackTypeToNative(trackType),
    );
  };

  /**
   * Toggle periodic performance reporting.
   *
   * While on, `e2ee.perf_report` is emitted once per second with per-track FPS
   * and crypto timings. Useful for debugging throughput.
   */
  enablePerformanceReporting = (enabled: boolean): void => {
    this.assertUsable();
    // Observational, so it is the one native call that need not block. Kept
    // void-returning to match the web manager.
    this.native
      .enablePerformanceReporting(enabled)
      .catch((err) =>
        this.logger.warn('Failed to toggle performance reporting', err),
      );
  };

  /**
   * Request a snapshot of the installed keys. It arrives later as the
   * `e2ee.key_state` event, listing fingerprints only, never key material.
   */
  requestKeyState = (): void => {
    this.assertUsable();
    this.native
      .requestKeyState()
      .catch((err) => this.logger.warn('Failed to request key state', err));
  };

  /**
   * Release the native manager and all resources.
   *
   * **The application owns this object's lifetime — the SDK never disposes it.**
   * Nothing releases the native manager when a peer connection closes, and there
   * is no detach API, so an undisposed manager keeps its transforms and its key
   * material alive for the lifetime of the process. Dispose it together with the
   * call instance whose flow has ended; a later flow gets a fresh call and a
   * fresh manager (see `Call.setE2EEManager`).
   *
   * In-flight frames are dropped rather than drained.
   *
   * The manager is unusable afterwards and every key or attach method throws.
   * Call {@link create} for a new one. Safe to call more than once.
   */
  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    for (const [type, handler] of this.bridged) {
      this.native.off(type, handler);
    }
    this.bridged.length = 0;
    try {
      this.native.dispose();
    } catch (err) {
      // Local cleanup still has to finish, or listeners outlive the manager.
      this.logger.warn('Failed to dispose the native encryption manager', err);
    }
    this.events.removeAllListeners();
  };

  /**
   * {@link dispose} releases the native manager, so an attached transform would
   * point at nothing: frames would stall with no error and no event. Throwing
   * is also fail-closed, since a caller that swallows it still publishes
   * nothing rather than cleartext.
   */
  private assertUsable = () => {
    if (this.disposed) throw new Error(`EncryptionManager is disposed`);
  };

  /**
   * The caller keeps ownership of its buffer and may re-import the same bytes,
   * so hand native a copy rather than a view onto memory that can change.
   */
  private copyKey = (rawKey: ArrayBuffer): Uint8Array => {
    const copy = new Uint8Array(rawKey.byteLength);
    copy.set(new Uint8Array(rawKey));
    return copy;
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
