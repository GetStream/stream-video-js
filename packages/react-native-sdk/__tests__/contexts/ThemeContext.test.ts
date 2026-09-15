/**
 * Tests for the theme override type and the deep merge behind `StreamTheme`.
 *
 * The type-level assertions below are the regression guard for the case where
 * `DeepPartial` recursed unconditionally: `Theme` carries a
 * `[component: string]: any` index signature, the mapped type inherited it as
 * `DeepPartial<any>`, and every override with a primitive leaf stopped
 * typechecking. These declarations only compile while that stays fixed, so they
 * are checked by `yarn test:types` rather than at runtime.
 *
 * The overrides deliberately name blocks `Theme` actually declares. Anything
 * else still compiles through that same index signature, so a stale block name
 * would leave these assertions passing against `undefined` rather than failing.
 */

import { type DeepPartial, mergeThemes } from '../../src/contexts/ThemeContext';
import { defaultTheme, type Theme } from '../../src/theme/theme';

const semanticsOverride: DeepPartial<Theme> = {
  semantics: { textPrimary: '#000000' },
};

const componentStyleOverride: DeepPartial<Theme> = {
  callControls: { container: { backgroundColor: 'red' } },
};

const nestedComponentOverride: DeepPartial<Theme> = {
  avatar: { container: { base: { backgroundColor: 'red' } } },
};

const sliceOverride: DeepPartial<Theme['semantics']> = {
  textPrimary: '#000000',
};

const customComponentOverride: DeepPartial<Theme> = {
  myCustomComponent: { anything: true },
};

describe('DeepPartial<Theme>', () => {
  it('accepts inline overrides at every depth', () => {
    expect(semanticsOverride.semantics?.textPrimary).toBe('#000000');
    expect(
      componentStyleOverride.callControls?.container?.backgroundColor,
    ).toBe('red');
    expect(
      nestedComponentOverride.avatar?.container?.base?.backgroundColor,
    ).toBe('red');
    expect(sliceOverride.textPrimary).toBe('#000000');
    expect(customComponentOverride.myCustomComponent?.anything).toBe(true);
  });
});

describe('mergeThemes', () => {
  it('returns the default theme when no override is given', () => {
    expect(mergeThemes({})).toEqual(defaultTheme);
  });

  it('merges an override into the defaults without dropping siblings', () => {
    const merged = mergeThemes({ style: semanticsOverride });

    expect(merged.semantics.textPrimary).toBe('#000000');
    expect(merged.semantics.textSecondary).toBe(
      defaultTheme.semantics.textSecondary,
    );
    expect(merged.primitives).toEqual(defaultTheme.primitives);
  });

  it('merges deeply nested component styles', () => {
    const merged = mergeThemes({ style: componentStyleOverride });

    expect(merged.callControls?.container?.backgroundColor).toBe('red');
  });

  it('merges a block nested below the component level', () => {
    const merged = mergeThemes({ style: nestedComponentOverride });

    expect(merged.avatar.container.base.backgroundColor).toBe('red');
    // the sibling size entries the override did not name survive
    expect(merged.avatar.container['2xl']).toEqual(
      defaultTheme.avatar.container['2xl'],
    );
  });

  it('does not mutate the default theme', () => {
    const before = defaultTheme.semantics.textPrimary;
    mergeThemes({ style: semanticsOverride });

    expect(defaultTheme.semantics.textPrimary).toBe(before);
  });

  it('ignores undefined values in the override', () => {
    const merged = mergeThemes({
      style: { semantics: { textPrimary: undefined } },
    });

    expect(merged.semantics.textPrimary).toBe(
      defaultTheme.semantics.textPrimary,
    );
  });
});
