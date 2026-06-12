import { useEffect, useState } from 'react';
import { callManager } from '../modules/call-manager';
import type { AudioDevicesState } from '../modules/call-manager/types';

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
    callManager.audioDevices.getStatus().then((s) => {
      if (active) setState(s);
    });
    const unsubscribe = callManager.audioDevices.addChangeListener(setState);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
};
