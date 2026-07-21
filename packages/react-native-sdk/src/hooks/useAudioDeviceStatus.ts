import { useEffect, useState } from 'react';
import { callManager } from '../modules/call-manager';
import type { AudioDevicesState } from '../modules/call-manager/types';

/**
 * Structural equality for two audio device states to avoid redundant re-renders.
 */
const areStatesEqual = (
  a: AudioDevicesState | undefined,
  b: AudioDevicesState,
): boolean => {
  if (!a) return false;
  if (
    a.selectedDeviceId !== b.selectedDeviceId ||
    a.currentEndpointType !== b.currentEndpointType ||
    a.devices.length !== b.devices.length
  ) {
    return false;
  }
  return a.devices.every((device, i) => {
    const other = b.devices[i];
    return (
      other !== undefined &&
      device.id === other.id &&
      device.name === other.name &&
      device.type === other.type
    );
  });
};

/**
 * Subscribes to the current audio output device state and keeps it in sync.
 *
 * Works on Android, iOS, and iOS with CallKit
 * (`@stream-io/react-native-callingx`) — the underlying source is selected
 * automatically. Pair with `callManager.audioDevices.select(device.id)` to
 * build a custom audio route picker.
 *
 * @returns the latest {@link AudioDevicesState}, or `undefined` until the
 * initial status resolves.
 *
 * @example
 * ```tsx
 * const status = useAudioDeviceStatus();
 * const { devices, selectedDeviceId } = status ?? {};
 * // callManager.audioDevices.select(devices[0].id);
 * ```
 */
export const useAudioDeviceStatus = (): AudioDevicesState | undefined => {
  const [state, setState] = useState<AudioDevicesState>();

  useEffect(() => {
    let active = true;
    const update = (next: AudioDevicesState) => {
      if (!active) return;
      setState((prev) => (areStatesEqual(prev, next) ? prev : next));
    };
    callManager.audioDevices.getStatus().then(update);
    const unsubscribe = callManager.audioDevices.addChangeListener(update);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
};
