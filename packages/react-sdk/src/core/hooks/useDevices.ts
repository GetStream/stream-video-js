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
 * @param devices$
 * @param switchToDefaultDevice
 * @param selectedDeviceId
 * @category Device Management
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
 * @category Device Management
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
 * @category Device Management
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
 * @category Device Management
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
 * Observes disconnect of all video devices and executes onDisconnect callback
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableVideoDevices = (onDisconnect: () => void) =>
  useOnUnavailableDevices(getVideoDevices(), onDisconnect);

/**
 * Observes disconnect of all audio input devices and executes onDisconnect callback
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableAudioInputDevices = (onDisconnect: () => void) =>
  useOnUnavailableDevices(getAudioDevices(), onDisconnect);

/**
 * Observes disconnect of all audio output devices and executes onDisconnect callback
 * @param onDisconnect
 * @category Device Management
 */
export const useOnUnavailableAudioOutputDevices = (onDisconnect: () => void) =>
  useOnUnavailableDevices(getAudioOutputDevices(), onDisconnect);
