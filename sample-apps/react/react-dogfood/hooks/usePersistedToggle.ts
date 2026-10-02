import { useCallback, useState } from 'react';

const readToggle = (storageKey: string, defaultValue: boolean) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored === null ? defaultValue : stored === 'true';
  } catch {
    return defaultValue;
  }
};

export const usePersistedToggle = (
  storageKey: string,
  defaultValue: boolean,
) => {
  const [enabled, _setEnabled] = useState(() =>
    readToggle(storageKey, defaultValue),
  );

  const setEnabled = useCallback(
    (value: boolean) => {
      _setEnabled(value);
      window.localStorage.setItem(storageKey, String(value));
    },
    [storageKey],
  );

  return [enabled, setEnabled] as const;
};
