import { useCallback, useState } from 'react';

export type DeviceSelectionPreference = 'system' | 'recent';

const DEVICE_PREFERENCE_KEY = '@pronto/device-preferences-enabled';

export const isRecentDeviceSelectionEnabled = () => {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(DEVICE_PREFERENCE_KEY) !== 'disabled';
  } catch {
    return true;
  }
};

export const useDeviceSelectionPreference = () => {
  const [deviceSelectionPreference, _setDeviceSelectionPreference] =
    useState<DeviceSelectionPreference>(() =>
      isRecentDeviceSelectionEnabled() ? 'recent' : 'system',
    );

  const setDeviceSelectionPreference = useCallback(
    (value: DeviceSelectionPreference) => {
      _setDeviceSelectionPreference(value);

      if (value === 'system') {
        window.localStorage.setItem(DEVICE_PREFERENCE_KEY, 'disabled');
      } else {
        window.localStorage.removeItem(DEVICE_PREFERENCE_KEY);
      }
    },
    [],
  );

  return { deviceSelectionPreference, setDeviceSelectionPreference };
};
