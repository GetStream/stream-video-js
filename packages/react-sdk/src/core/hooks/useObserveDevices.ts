import { useEffect, useState } from 'react';
import { Observable, pairwise } from 'rxjs';
import {
  getAudioDevices,
  getAudioOutputDevices,
  getVideoDevices,
} from '@stream-io/video-client';

/**
 * Observes changes in connected devices and maintains an up-to-date array of connected MediaDeviceInfo objects.
 * @param observeDevices
 */
export const useObserveDevices = (
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
 */
export const useObserveVideoDevices = () => useObserveDevices(getVideoDevices);

/**
 * Observes changes and maintains an array of connected audio input devices
 */
export const useObserveAudioInputDevices = () =>
  useObserveDevices(getAudioDevices);

/**
 * Observes changes and maintains an array of connected audio output devices
 */
export const useObserveAudioOutputDevices = () =>
  useObserveDevices(getAudioOutputDevices);

/**
 * Verifies that newly selected device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default device.
 * @param devices$
 * @param switchToDefaultDevice
 * @param selectedDeviceId
 */
export const useDeviceFallback = (
  devices$: Observable<MediaDeviceInfo[]>,
  switchToDefaultDevice: () => void,
  selectedDeviceId?: string,
) => {
  useEffect(() => {
    const validateDeviceId = devices$.pipe().subscribe((devices) => {
      const deviceFound = devices.find(
        (device) => device.deviceId === selectedDeviceId,
      );
      if (!deviceFound) switchToDefaultDevice();
    });

    return () => {
      validateDeviceId.unsubscribe();
    };
  }, [devices$, selectedDeviceId, switchToDefaultDevice]);
};

/**
 * Verifies that newly selected video device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default video device.
 * @param switchToDefaultDevice
 * @param selectedDeviceId
 */
export const useVideoDeviceFallback = (
  switchToDefaultDevice: () => void,
  selectedDeviceId?: string,
) =>
  useDeviceFallback(getVideoDevices(), switchToDefaultDevice, selectedDeviceId);

/**
 * Verifies that newly selected audio input device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default audio input device.
 * @param switchToDefaultDevice
 * @param selectedDeviceId
 */
export const useAudioInputDeviceFallback = (
  switchToDefaultDevice: () => void,
  selectedDeviceId?: string,
) =>
  useDeviceFallback(getAudioDevices(), switchToDefaultDevice, selectedDeviceId);

/**
 * Verifies that newly selected audio output device id exists among the registered devices.
 * If the selected device id is not found among existing devices, switches to the default audio output device.
 * @param switchToDefaultDevice
 * @param selectedDeviceId
 */
export const useAudioOutputDeviceFallback = (
  switchToDefaultDevice: () => void,
  selectedDeviceId?: string,
) =>
  useDeviceFallback(
    getAudioOutputDevices(),
    switchToDefaultDevice,
    selectedDeviceId,
  );

/**
 * Observes devices of certain kind are made unavailable and executes onDisconnect callback
 * @param observeDevices
 * @param onDisconnect
 */
export const useObserveUnavailableDevices = (
  observeDevices: () => Observable<MediaDeviceInfo[]>,
  onDisconnect: () => void,
) => {
  useEffect(() => {
    const subscription = observeDevices()
      .pipe(pairwise())
      .subscribe(([prev, current]) => {
        if (prev.length > 0 && current.length === 0) onDisconnect();
      });

    return () => subscription.unsubscribe();
  }, [observeDevices, onDisconnect]);
};

/**
 * Observes disconnect of all video devices and executes onDisconnect callback
 * @param onDisconnect
 */
export const useObserveUnavailableVideoDevices = (onDisconnect: () => void) =>
  useObserveUnavailableDevices(getVideoDevices, onDisconnect);
