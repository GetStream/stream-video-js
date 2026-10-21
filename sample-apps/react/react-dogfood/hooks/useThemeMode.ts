import { useCallback, useEffect, useState } from 'react';
import type { StreamThemeMode } from '@stream-io/video-react-sdk';

export type ThemeMode = StreamThemeMode;

const THEME_MODE_KEY = '@pronto/theme-mode';

const DEFAULT_THEME_MODE: ThemeMode = 'dark';

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return DEFAULT_THEME_MODE;
  try {
    const stored = window.localStorage.getItem(THEME_MODE_KEY);
    return stored === 'light' || stored === 'dark'
      ? stored
      : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
};

export const useThemeMode = () => {
  const [themeMode, _setThemeMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);

  useEffect(() => {
    _setThemeMode(getStoredThemeMode());
  }, []);

  const setThemeMode = useCallback((value: ThemeMode) => {
    _setThemeMode(value);
    try {
      window.localStorage.setItem(THEME_MODE_KEY, value);
    } catch (e) {
      console.warn(`Theme mode couldn't be stored`, e);
    }
  }, []);

  return { themeMode, setThemeMode };
};

export const chatThemeClass = (mode: ThemeMode) =>
  mode === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light';
