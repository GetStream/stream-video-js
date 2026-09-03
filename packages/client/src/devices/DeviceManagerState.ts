import { StateStore } from '@stream-io/state-store';
import { field, type Subscribable } from '../store/subscribable';
import { BrowserPermission, BrowserPermissionState } from './BrowserPermission';

export type InputDeviceStatus = 'enabled' | 'disabled' | undefined;
export type TrackDisableMode = 'stop-tracks' | 'disable-tracks';

/**
 * The state every device manager holds.
 *
 * Declared as a `type` so it satisfies `StateStore`'s `Record<string, unknown>`
 * constraint, which an interface would not.
 */
export type DeviceManagerStateShape<C> = {
  status: InputDeviceStatus;
  optimisticStatus: InputDeviceStatus;
  mediaStream: MediaStream | undefined;
  rootMediaStream: MediaStream | undefined;
  selectedDevice: string | undefined;
  defaultConstraints: C | undefined;

  /**
   * The browser permission state, or `undefined` while it is still unknown.
   */
  browserPermissionState: BrowserPermissionState | undefined;

  /**
   * `true` when permission is granted, or at least has not been denied.
   *
   * In some browsers the `change` event does not fire reliably and the state
   * stays `prompt` forever (typically after a one-time grant), so we check
   * for "not denied" rather than for "granted".
   */
  hasBrowserPermission: boolean;

  /**
   * `true` while the browser's permission UI is on screen.
   */
  isPromptingPermission: boolean;
};

export abstract class DeviceManagerState<
  C = MediaTrackConstraints,
  // `any` on purpose: `StateStore` is invariant in its state type, so a
  // stricter default would stop `CameraManagerState` and friends from
  // satisfying an `S extends DeviceManagerState<C>` constraint. Subclasses
  // still get their own precise shape.
  Extra extends Record<string, unknown> = any,
> {
  /**
   * The backing store. Use it to read or subscribe to several values at once.
   */
  readonly store: StateStore<DeviceManagerStateShape<C> & Extra>;

  /**
   * @internal
   */
  prevStatus: InputDeviceStatus;

  /**
   * The current media stream, or `undefined` if the device is currently disabled.
   */
  readonly mediaStream$: Subscribable<MediaStream | undefined>;

  /**
   * The currently selected device
   */
  readonly selectedDevice$: Subscribable<string | undefined>;

  /**
   * The device status
   */
  readonly status$: Subscribable<InputDeviceStatus>;

  /**
   * The browser permission state, updated as it changes.
   * Gives more granular visiblity than hasBrowserPermission$.
   */
  readonly browserPermissionState$: Subscribable<
    BrowserPermissionState | undefined
  >;

  readonly disableMode: TrackDisableMode;

  private readonly unlistenPermission: (() => void) | undefined;

  /**
   * Constructs a new InputMediaDeviceManagerState instance.
   *
   * @param disableMode the disable mode to use.
   * @param permission the BrowserPermission to use for querying.
   * `undefined` means no permission is required.
   * @param extraState additional state contributed by a subclass.
   */
  constructor(
    disableMode: TrackDisableMode,
    permission: BrowserPermission | undefined,
    extraState: Extra = {} as Extra,
  ) {
    this.disableMode = disableMode;

    this.store = new StateStore<DeviceManagerStateShape<C> & Extra>({
      status: undefined,
      optimisticStatus: undefined,
      mediaStream: undefined,
      rootMediaStream: undefined,
      selectedDevice: undefined,
      defaultConstraints: undefined,
      // with no permission to query, access is granted unconditionally
      browserPermissionState: permission ? undefined : 'prompt',
      hasBrowserPermission: !permission,
      isPromptingPermission: false,
      ...extraState,
    });

    this.unlistenPermission = permission?.listen((state) => {
      this.store.partialNext({
        browserPermissionState: state,
        hasBrowserPermission: state !== 'denied',
        isPromptingPermission: state === 'prompting',
      } as Partial<DeviceManagerStateShape<C> & Extra>);
    });

    this.mediaStream$ = field(this.store, 'mediaStream');
    this.selectedDevice$ = field(this.store, 'selectedDevice');
    this.status$ = field(this.store, 'status');
    this.browserPermissionState$ = field(this.store, 'browserPermissionState');
  }

  /**
   * Stops mirroring the browser permission state.
   */
  dispose() {
    this.unlistenPermission?.();
  }

  /**
   * Applies a partial update to this device's state.
   *
   * @internal
   */
  setState(patch: Partial<DeviceManagerStateShape<C> & Extra>) {
    this.store.partialNext(patch);
  }

  /**
   * The browser permission state, or `undefined` while it is still unknown.
   */
  get browserPermissionState() {
    return this.store.getLatestValue().browserPermissionState;
  }

  /**
   * `true` when browser/system permission is granted, or at least has not
   * been denied. `false` until the permission state is known.
   */
  get hasBrowserPermission() {
    return this.store.getLatestValue().hasBrowserPermission;
  }

  /**
   * `true` while the browser's permission UI is on screen.
   */
  get isPromptingPermission() {
    return this.store.getLatestValue().isPromptingPermission;
  }

  /**
   * The device status
   */
  get status() {
    return this.store.getLatestValue().status;
  }

  /**
   * The requested device status. Useful for optimistic UIs
   */
  get optimisticStatus() {
    return this.store.getLatestValue().optimisticStatus;
  }

  /**
   * The currently selected device
   */
  get selectedDevice() {
    return this.store.getLatestValue().selectedDevice;
  }

  /**
   * The current media stream, or `undefined` if the device is currently disabled.
   */
  get mediaStream() {
    return this.store.getLatestValue().mediaStream;
  }

  /**
   * The raw device media stream (before any filters are applied), or `undefined`
   * if the device is currently disabled. When no filters are active, this is the
   * same as `mediaStream`.
   */
  get rootMediaStream() {
    return this.store.getLatestValue().rootMediaStream;
  }

  /**
   * @internal
   * @param status
   */
  setStatus(status: InputDeviceStatus) {
    this.setState({ status } as Partial<DeviceManagerStateShape<C> & Extra>);
  }

  /**
   * @internal
   * @param pendingStatus
   */
  setPendingStatus(pendingStatus: InputDeviceStatus) {
    this.setState({ optimisticStatus: pendingStatus } as Partial<
      DeviceManagerStateShape<C> & Extra
    >);
  }

  /**
   * Updates the `mediaStream` state variable.
   *
   * @internal
   * @param stream the stream to set.
   * @param rootStream the root stream, applicable when filters are used
   * as this is the stream that holds the actual deviceId information.
   */
  setMediaStream(
    stream: MediaStream | undefined,
    rootStream: MediaStream | undefined,
  ) {
    this.setState({
      mediaStream: stream,
      rootMediaStream: rootStream,
    } as Partial<DeviceManagerStateShape<C> & Extra>);
    if (rootStream) {
      const derived = this.getDeviceIdFromStream(rootStream);
      if (derived) {
        this.setDevice(derived);
      }
    }
  }

  /**
   * @internal
   * @param deviceId the device id to set.
   */
  setDevice(deviceId: string | undefined) {
    this.setState({ selectedDevice: deviceId } as Partial<
      DeviceManagerStateShape<C> & Extra
    >);
  }

  /**
   * Gets the default constraints for the device.
   */
  get defaultConstraints() {
    return this.store.getLatestValue().defaultConstraints;
  }

  /**
   * Sets the default constraints for the device.
   *
   * @internal
   * @param constraints the constraints to set.
   */
  setDefaultConstraints(constraints: C | undefined) {
    this.setState({ defaultConstraints: constraints } as Partial<
      DeviceManagerStateShape<C> & Extra
    >);
  }

  protected abstract getDeviceIdFromStream(
    stream: MediaStream,
  ): string | undefined;
}
