import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import {
  resolveTheme,
  type Theme,
  type ThemeColorScheme,
} from '../theme/theme';

/**
 * Recursively marks every property of `T` as optional.
 *
 * The `extends object` guard is required, not cosmetic: `Theme` carries a
 * `[component: string]: any` index signature, which the mapped type inherits.
 * Without the guard that index signature becomes `DeepPartial<any>`, an
 * all-object type that no primitive leaf can satisfy, and every theme override
 * fails to typecheck. Guarding short-circuits `any` back to `any`.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type StreamThemeInputValue = {
  mergedStyle?: Theme;
  style?: DeepPartial<Theme>;
  colorScheme?: ThemeColorScheme;
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

  const base =
    !theme || Object.keys(theme).length === 0 ? resolveTheme('light') : theme;

  const finalTheme = JSON.parse(JSON.stringify(base)) as Theme;
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
  const { children, mergedStyle, style, theme, colorScheme } = props;

  const parentTheme = useContext(ThemeContext);
  const inheritedTheme =
    parentTheme === DEFAULT_BASE_CONTEXT_VALUE ? undefined : parentTheme;

  const modifiedTheme = useMemo(() => {
    if (mergedStyle) {
      return mergedStyle;
    }

    // Picks the base theme that `style` is then layered on top of. The first
    // of these that is present wins:
    //
    //   1. `theme`        - a complete theme supplied by the consumer.
    //   2. `colorScheme`  - prebuild theme corresponding to the color scheme.
    //   3. the parent     - the theme of an enclosing `StreamTheme`, so a
    //                       nested provider adding a few overrides keeps the
    //                       scheme chosen above.
    //   4. light          - default when all else is undefined.
    const base =
      theme ?? (colorScheme ? resolveTheme(colorScheme) : inheritedTheme);

    return mergeThemes({ style, theme: base });
  }, [mergedStyle, style, theme, colorScheme, inheritedTheme]);

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
