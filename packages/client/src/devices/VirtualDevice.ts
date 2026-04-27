/**
 * A MediaStream acquired for a virtual device session, along with an optional
 * cleanup callback. Returned by {@link RegisterVirtualDeviceOptions.acquire}.
 */
export interface VirtualDeviceSession {
  readonly stream: MediaStream;
  readonly stop?: () => void | Promise<void>;
}

export interface ActiveVirtualSession {
  deviceId: string;
  stop?: () => void | Promise<void>;
}

export interface VirtualDeviceEntry {
  readonly deviceId: string;
  readonly label: string;
  readonly kind: 'audioinput' | 'videoinput';
  readonly acquire: () => VirtualDeviceSession | Promise<VirtualDeviceSession>;
}

export interface RegisterVirtualDeviceOptions {
  /**
   * Acquires the MediaStream to publish when this device is selected and
   * optionally returns cleanup that should run when that acquired stream is
   * stopped or replaced.
   */
  acquire: () => VirtualDeviceSession | Promise<VirtualDeviceSession>;

  /**
   * Human-readable label shown in device dropdowns.
   */
  label: string;
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

export const VIRTUAL_DEVICE_PREFIX = 'virtual:';
