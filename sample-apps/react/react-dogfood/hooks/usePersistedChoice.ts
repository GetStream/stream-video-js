import { useCallback, useState } from 'react';

const readChoice = <T extends string>(
  storageKey: string,
  valid: readonly T[],
  fallback: T,
): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return valid.includes(stored as T) ? (stored as T) : fallback;
  } catch {
    return fallback;
  }
};

export const usePersistedChoice = <T extends string>(
  storageKey: string,
  valid: readonly T[],
  fallback: T,
) => {
  const [choice, _setChoice] = useState<T>(() =>
    readChoice(storageKey, valid, fallback),
  );

  const setChoice = useCallback(
    (value: T) => {
      _setChoice(value);
      try {
        window.localStorage.setItem(storageKey, value);
      } catch {
        // Keep the preference usable for this session if storage is unavailable.
      }
    },
    [storageKey],
  );

  return [choice, setChoice] as const;
};
