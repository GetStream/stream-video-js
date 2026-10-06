import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import {
  resolveTheme,
  TOKEN_GROUPS,
  type Theme,
  type ThemeColorScheme,
} from '../theme/theme';
import type { IStreamTokens } from '../theme/tokens';
import { deepMerge, type DeepPartial } from '../theme/deepMerge';

export type { DeepPartial };

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
  colorScheme?: ThemeColorScheme;
};

export type ThemeContextValue = {
  theme: Theme;
};

const TOKEN_GROUP_KEYS: ReadonlySet<string> = new Set(TOKEN_GROUPS);

type SplitStyle = {
  tokenOverrides: DeepPartial<IStreamTokens>;
  componentStyleOverrides: DeepPartial<Theme>;
};

const splitStyle = (style?: DeepPartial<Theme>): SplitStyle => {
  const tokenOverrides: Record<string, unknown> = {};
  const componentStyleOverrides: Record<string, unknown> = {};

  for (const key of Object.keys(style ?? {})) {
    const value = (style as Record<string, unknown>)[key];
    if (value === undefined) continue;

    const bucket = TOKEN_GROUP_KEYS.has(key)
      ? tokenOverrides
      : componentStyleOverrides;
    bucket[key] = value;
  }

  return { tokenOverrides, componentStyleOverrides };
};

/**
 * Token overrides are folded into the raw tokens before resolution,
 * so everything derived from them is rebuilt. So when `theme` is given
 * or inherited they are ignored - override the component style instead.
 */
export const mergeThemes = (params: MergedThemesParams) => {
  const { style, theme, colorScheme } = params;
  const { tokenOverrides, componentStyleOverrides } = splitStyle(style);

  const inherited = theme && Object.keys(theme).length > 0 ? theme : undefined;

  const base =
    inherited ?? resolveTheme(colorScheme ?? 'light', tokenOverrides);

  let finalTheme = JSON.parse(JSON.stringify(base)) as Theme;
  finalTheme = deepMerge(finalTheme, componentStyleOverrides);

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
    const base = theme ?? (colorScheme ? undefined : inheritedTheme);

    return mergeThemes({ style, theme: base, colorScheme });
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
