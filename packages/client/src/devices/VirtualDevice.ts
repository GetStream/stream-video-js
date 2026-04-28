/**
 * A MediaStream produced for a virtual device session, along with an optional
 * cleanup callback. Returned by {@link VirtualDevice.getUserMedia}.
 */
export interface VirtualDeviceSession {
  readonly stream: MediaStream;
  readonly stop?: () => void | Promise<void>;
}

/**
 * A virtual camera or microphone definition supplied by the integrator.
 *
 * Pass this to `camera.registerVirtualDevice()` /
 * `microphone.registerVirtualDevice()` to make it appear in the device list
 * and become selectable.
 */
export interface VirtualDevice<C = MediaTrackConstraints> {
  /**
   * Human-readable label shown in device dropdowns.
   */
  label: string;

  /**
   * Called when the virtual device is selected and the SDK needs media.
   * Returns the MediaStream to publish along with an optional `stop`
   * callback that runs when the session is replaced, the tracks end, or
   * the device is unregistered.
   *
   * `constraints` is the resolved set the SDK would otherwise pass to
   * `getUserMedia` for a real device.
   */
  getUserMedia: (
    constraints: C,
  ) => VirtualDeviceSession | Promise<VirtualDeviceSession>;
}

/**
 * @internal Internal entry stored in the device manager's registry.
 */
export interface VirtualDeviceEntry<C = MediaTrackConstraints>
  extends VirtualDevice<C> {
  readonly deviceId: string;
  readonly kind: 'audioinput' | 'videoinput';
}

/**
 * @internal Tracks the currently active virtual device session inside the
 * device manager so its `stop` callback can be invoked when the session is
 * replaced or torn down.
 */
export interface ActiveVirtualSession {
  deviceId: string;
  stop?: () => void | Promise<void>;
}

export interface VirtualDeviceHandle {
  /**
   * The device id under which the virtual device was registered. Pass this
   * to `camera.select()` / `microphone.select()` to switch to it.
   */
  readonly deviceId: string;

  /**
   * Removes the virtual device from the manager. If it is currently selected,
   * the selection is reset so the SDK falls back to the default device.
   */
  unregister: () => Promise<void>;
}

export const VIRTUAL_DEVICE_PREFIX = 'stream-virtual:';
