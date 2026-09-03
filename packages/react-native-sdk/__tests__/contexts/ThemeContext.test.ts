/**
 * Tests for the theme override type and the deep merge behind `StreamTheme`.
 *
 * The type-level assertions below are the regression guard for the case where
 * `DeepPartial` recursed unconditionally: `Theme` carries a
 * `[component: string]: any` index signature, the mapped type inherited it as
 * `DeepPartial<any>`, and every override with a primitive leaf stopped
 * typechecking. These declarations only compile while that stays fixed, so they
 * are checked by `yarn test:types` rather than at runtime.
 */

import { type DeepPartial, mergeThemes } from '../../src/contexts/ThemeContext';
import { defaultTheme, type Theme } from '../../src/theme/theme';

const colorOverride: DeepPartial<Theme> = {
  colors: { textPrimary: '#000000' },
};

const componentStyleOverride: DeepPartial<Theme> = {
  callControls: { container: { backgroundColor: 'red' } },
};

const variantOverride: DeepPartial<Theme> = {
  variants: { roundButtonSizes: { md: 40 } },
};

const sliceOverride: DeepPartial<Theme['colors']> = {
  textPrimary: '#000000',
};

const customComponentOverride: DeepPartial<Theme> = {
  myCustomComponent: { anything: true },
};

describe('DeepPartial<Theme>', () => {
  it('accepts inline overrides at every depth', () => {
    expect(colorOverride.colors?.textPrimary).toBe('#000000');
    expect(
      componentStyleOverride.callControls?.container?.backgroundColor,
    ).toBe('red');
    expect(variantOverride.variants?.roundButtonSizes?.md).toBe(40);
    expect(sliceOverride.textPrimary).toBe('#000000');
    expect(customComponentOverride.myCustomComponent?.anything).toBe(true);
  });
});

describe('mergeThemes', () => {
  it('returns the default theme when no override is given', () => {
    expect(mergeThemes({})).toEqual(defaultTheme);
  });

  it('merges an override into the defaults without dropping siblings', () => {
    const merged = mergeThemes({ style: colorOverride });

    expect(merged.colors.textPrimary).toBe('#000000');
    expect(merged.colors.textSecondary).toBe(defaultTheme.colors.textSecondary);
    expect(merged.variants).toEqual(defaultTheme.variants);
  });

  it('merges deeply nested component styles', () => {
    const merged = mergeThemes({ style: componentStyleOverride });

    expect(merged.callControls.container.backgroundColor).toBe('red');
  });

  it('does not mutate the default theme', () => {
    const before = defaultTheme.colors.textPrimary;
    mergeThemes({ style: colorOverride });

    expect(defaultTheme.colors.textPrimary).toBe(before);
  });

  it('ignores undefined values in the override', () => {
    const merged = mergeThemes({
      style: { colors: { textPrimary: undefined } },
    });

    expect(merged.colors.textPrimary).toBe(defaultTheme.colors.textPrimary);
  });
});
