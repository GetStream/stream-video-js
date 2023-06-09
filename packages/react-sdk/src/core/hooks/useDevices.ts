import { ChangeEvent, useEffect, useState } from 'react';
import { Observable, pairwise } from 'rxjs';
import {
  getAudioDevices,
  getAudioOutputDevices,
  getVideoDevices,
} from '@stream-io/video-client';

export const useHasBrowserPermissions = (permissionName: PermissionName) => {
  const [canSubscribe, enableSubscription] = useState(false);

  useEffect(() => {
    let permissionState: PermissionStatus;
    const handlePermissionChange = (e: Event) => {
      const { state } = (e as unknown as ChangeEvent<PermissionStatus>).target;
      enableSubscription(state === 'granted');
    };
    const checkPermissions = async () => {
      try {
        permissionState = await navigator.permissions.query({
          name: permissionName,
        });
        permissionState.addEventListener('change', handlePermissionChange);
        enableSubscription(permissionState.state === 'granted');
      } catch (e) {
        // permission does not exist - cannot be queried
        // an example would be Firefox - camera, neither microphone perms can be queried
        enableSubscription(true);
      }
    };
    checkPermissions();

    return () => {
      permissionState?.removeEventListener('change', handlePermissionChange);
    };
  }, [permissionName]);

  return canSubscribe;
};

/**
 * Observes changes in connected devices and maintains an up-to-date array of connected MediaDeviceInfo objects.
 * @param observeDevices
 * @category Device Management
 */
export const useDevices = (
  observeDevices: () => Observable<MediaDeviceInfo[]>,
) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const subscription = observeDevices().subscribe(setDevices);

    return () => {
      subscription.unsubscribe();
    };
  }, [observeDevices]);

  return devices;
};

/**
 * Observes changes and maintains an array of connected video input devices
 * @category Device Management
 */
export const useVideoDevices = () => useDevices(getVideoDevices);

/**
 * Observes changes and maintains an array of connected audio input devices
 * @category Device Management
 */
export const useAudioInputDevices = () => useDevices(getAudioDevices);

/**
 * Observes changes and maintains an array of connected audio output devices
 * @category Device Management
 */
export const useAudioOutputDevices = () => useDevices(getAudioOutputDevices);

/**
 * Verifies that newly selected device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default device.
 * The media devices are observed only if a given permission ('camera' resp. 'microphone') is granted in browser.
 * Regardless of current permissions settings, an intent to observe devices will take place in Firefox.
 * This is due to the fact that Firefox does not allow to query for 'camera' and 'microphone' permissions.
 * @param canObserve
 * @param devices$
 * @param switchToDefaultDevice
 * @param selectedDeviceId
 * @category Device Management
 */
export const useDeviceFallback = (
  canObserve: boolean,
  devices$: Observable<MediaDeviceInfo[]>,
  switchToDefaultDevice: () => void,
  selectedDeviceId?: string,
) => {
  useEffect(() => {
    if (!canObserve) return;
    const validateDeviceId = devices$.pipe().subscribe((devices) => {
      const deviceFound = devices.find(
        (device) => device.deviceId === selectedDeviceId,
      );
      if (!deviceFound) switchToDefaultDevice();
    });

    return () => {
      validateDeviceId.unsubscribe();
    };
  }, [canObserve, devices$, selectedDeviceId, switchToDefaultDevice]);
};

/**
 * Verifies that newly selected video device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default video device.
 * The media devices are observed only if 'camera' permission is granted in browser.
 * It is integrators responsibility to instruct users how to enable required permissions.
 * Regardless of current permissions settings, an intent to observe devices will take place in Firefox.
 * This is due to the fact that Firefox does not allow to query for 'camera' and 'microphone' permissions.
 * @param switchToDefaultDevice
 * @param canObserve
 * @param selectedDeviceId
 * @category Device Management
 */
export const useVideoDeviceFallback = (
  switchToDefaultDevice: () => void,
  canObserve: boolean,
  selectedDeviceId?: string,
) =>
  useDeviceFallback(
    canObserve,
    getVideoDevices(),
    switchToDefaultDevice,
    selectedDeviceId,
  );

/**
 * Verifies that newly selected audio input device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default audio input device.
 * The media devices are observed only if 'microphone' permission is granted in browser.
 * It is integrators responsibility to instruct users how to enable required permissions.
 * Regardless of current permissions settings, an intent to observe devices will take place in Firefox.
 * This is due to the fact that Firefox does not allow to query for 'camera' and 'microphone' permissions.
 * @param switchToDefaultDevice
 * @param canObserve
 * @param selectedDeviceId
 * @category Device Management
 */
export const useAudioInputDeviceFallback = (
  switchToDefaultDevice: () => void,
  canObserve: boolean,
  selectedDeviceId?: string,
) =>
  useDeviceFallback(
    canObserve,
    getAudioDevices(),
    switchToDefaultDevice,
    selectedDeviceId,
  );

/**
 * Verifies that newly selected audio output device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default audio output device.
 * The media devices are observed only if 'microphone' permission is granted in browser.
 * It is integrators responsibility to instruct users how to enable required permissions.
 * Regardless of current permissions settings, an intent to observe devices will take place in Firefox.
 * This is due to the fact that Firefox does not allow to query for 'camera' and 'microphone' permissions.
 * @param switchToDefaultDevice
 * @param canObserve
 * @param selectedDeviceId
 * @category Device Management
 */
export const useAudioOutputDeviceFallback = (
  switchToDefaultDevice: () => void,
  canObserve: boolean,
  selectedDeviceId?: string,
) =>
  useDeviceFallback(
    canObserve,
    getAudioOutputDevices(),
    switchToDefaultDevice,
    selectedDeviceId,
  );

/**
 * Observes devices of certain kind are made unavailable and executes onDisconnect callback.
 * @param observeDevices
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableDevices = (
  observeDevices: Observable<MediaDeviceInfo[]>,
  onDisconnect: () => void,
) => {
  useEffect(() => {
    const subscription = observeDevices
      .pipe(pairwise())
      .subscribe(([prev, current]) => {
        if (prev.length > 0 && current.length === 0) onDisconnect();
      });

    return () => subscription.unsubscribe();
  }, [observeDevices, onDisconnect]);
};

/**
 * Observes disconnect of all video devices and executes onDisconnect callback.
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableVideoDevices = (onDisconnect: () => void) =>
  useOnUnavailableDevices(getVideoDevices(), onDisconnect);

/**
 * Observes disconnect of all audio input devices and executes onDisconnect callback.
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableAudioInputDevices = (onDisconnect: () => void) =>
  useOnUnavailableDevices(getAudioDevices(), onDisconnect);

/**
 * Observes disconnect of all audio output devices and executes onDisconnect callback.
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableAudioOutputDevices = (onDisconnect: () => void) =>
  useOnUnavailableDevices(getAudioOutputDevices(), onDisconnect);
