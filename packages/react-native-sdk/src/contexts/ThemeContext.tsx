import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import { defaultTheme, type Theme } from '../theme/theme';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type StreamThemeInputValue = {
  mergedStyle?: Theme;
  style?: DeepPartial<Theme>;
};

/**
 * @deprecated Use StreamThemeInputValue instead.
 */
export type ThemeProviderInputValue = StreamThemeInputValue;

export type MergedThemesParams = {
  style?: DeepPartial<Theme>;
  theme?: Theme;
};

export type ThemeContextValue = {
  theme: Theme;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const merge = <T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>,
) => {
  for (const key in source) {
    const sourceValue = source[key];
    if (sourceValue === undefined) continue;

    const targetValue = target[key as keyof T];
    if (isObject(sourceValue) && isObject(targetValue)) {
      merge(targetValue, sourceValue as DeepPartial<Record<string, unknown>>);
    } else {
      target[key as keyof T] = sourceValue as T[keyof T];
    }
  }
};

export const mergeThemes = (params: MergedThemesParams) => {
  const { style, theme } = params;
  const finalTheme = (
    !theme || Object.keys(theme).length === 0
      ? JSON.parse(JSON.stringify(defaultTheme))
      : JSON.parse(JSON.stringify(theme))
  ) as Theme;

  if (style) {
    merge(finalTheme, style);
  }

  return finalTheme;
};

const DEFAULT_BASE_CONTEXT_VALUE = {};

export const ThemeContext = createContext<Theme>(
  DEFAULT_BASE_CONTEXT_VALUE as Theme,
);

export const StreamTheme: React.FC<
  PropsWithChildren<StreamThemeInputValue & Partial<ThemeContextValue>>
> = (props) => {
  const { children, mergedStyle, style, theme } = props;

  const modifiedTheme = useMemo(() => {
    if (mergedStyle) {
      return mergedStyle;
    }

    return mergeThemes({ style, theme });
  }, [mergedStyle, style, theme]);

  return (
    <ThemeContext.Provider value={modifiedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * @deprecated Use StreamTheme instead of ThemeProvider.
 */
export const ThemeProvider = StreamTheme;

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  if (theme === DEFAULT_BASE_CONTEXT_VALUE) {
    throw new Error(
      'The useThemeContext hook was called outside the ThemeContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }
  return { theme };
};
