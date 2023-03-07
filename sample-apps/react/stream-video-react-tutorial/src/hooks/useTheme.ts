import { useCallback, useState } from 'react';

const TOGGLE: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'light',
};

type Theme = 'dark' | 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(
    () =>
      (localStorage.getItem('theme') as Theme) ||
      (window?.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );

  const toggleTheme = useCallback(() => {
    setTheme(TOGGLE[theme]);
    localStorage.setItem('theme', TOGGLE[theme]);
  }, [theme]);

  return {
    theme,
    toggleTheme,
  };
};
