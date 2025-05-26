import { useCallback, useState } from 'react';

export type DeviceSelectionPreference = 'system' | 'recent';

export const DEVICE_PREFERENCE_KEY = '@pronto/device-preferences';

export const useDeviceSelectionPreference = () => {
  const [deviceSelectionPreference, _setDeviceSelectionPreference] =
    useState<DeviceSelectionPreference>(() =>
      typeof window !== 'undefined' &&
      window.localStorage.getItem(DEVICE_PREFERENCE_KEY) === 'disabled'
        ? 'system'
        : 'recent',
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
