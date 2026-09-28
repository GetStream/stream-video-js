/**
 * Covers how `StreamTheme` picks the theme it provides: the scheme prop, and
 * the inheritance that keeps a nested provider from resetting the subtree to
 * the light default.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StreamTheme, useTheme } from '../../src/contexts/ThemeContext';
import { resolveTheme, type Theme } from '../../src/theme/theme';

const light = resolveTheme('light');
const dark = resolveTheme('dark');

const TEXT_PRIMARY = 'text-primary';
const BACKGROUND = 'background';

const ThemeProbe = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <>
      <Text testID={TEXT_PRIMARY}>{String(semantics.textPrimary)}</Text>
      <Text testID={BACKGROUND}>{String(semantics.backgroundCoreApp)}</Text>
    </>
  );
};

const textPrimary = () => screen.getByTestId(TEXT_PRIMARY).props.children;
const background = () => screen.getByTestId(BACKGROUND).props.children;

describe('StreamTheme', () => {
  it('resolves the light scheme by default', () => {
    render(
      <StreamTheme>
        <ThemeProbe />
      </StreamTheme>,
    );

    expect(textPrimary()).toBe(String(light.semantics.textPrimary));
  });

  it('resolves the requested scheme', () => {
    render(
      <StreamTheme colorScheme="dark">
        <ThemeProbe />
      </StreamTheme>,
    );

    expect(textPrimary()).toBe(String(dark.semantics.textPrimary));
  });

  it('inherits the surrounding theme in a nested provider', () => {
    render(
      <StreamTheme colorScheme="dark">
        <StreamTheme style={{ semantics: { textPrimary: '#ff0000' } }}>
          <ThemeProbe />
        </StreamTheme>
      </StreamTheme>,
    );

    expect(textPrimary()).toBe('#ff0000');
    expect(background()).toBe(String(dark.semantics.backgroundCoreApp));
  });

  it('lets a nested provider override the inherited scheme', () => {
    render(
      <StreamTheme colorScheme="dark">
        <StreamTheme colorScheme="light">
          <ThemeProbe />
        </StreamTheme>
      </StreamTheme>,
    );

    expect(textPrimary()).toBe(String(light.semantics.textPrimary));
  });

  it('carries a nested override further down the tree', () => {
    render(
      <StreamTheme colorScheme="dark">
        <StreamTheme style={{ semantics: { textPrimary: '#ff0000' } }}>
          <StreamTheme>
            <ThemeProbe />
          </StreamTheme>
        </StreamTheme>
      </StreamTheme>,
    );

    // the grandchild sees the scheme from the top and the override from the middle
    expect(textPrimary()).toBe('#ff0000');
    expect(background()).toBe(String(dark.semantics.backgroundCoreApp));
  });

  it('uses an explicit theme as the base', () => {
    render(
      <StreamTheme theme={dark}>
        <ThemeProbe />
      </StreamTheme>,
    );

    expect(textPrimary()).toBe(String(dark.semantics.textPrimary));
  });

  it('prefers an explicit theme over the requested scheme', () => {
    render(
      <StreamTheme theme={dark} colorScheme="light">
        <ThemeProbe />
      </StreamTheme>,
    );

    expect(textPrimary()).toBe(String(dark.semantics.textPrimary));
  });

  it('prefers an explicit theme over the inherited one', () => {
    render(
      <StreamTheme colorScheme="dark">
        <StreamTheme theme={light}>
          <ThemeProbe />
        </StreamTheme>
      </StreamTheme>,
    );

    expect(textPrimary()).toBe(String(light.semantics.textPrimary));
  });

  it('returns mergedStyle verbatim, ignoring style and colorScheme', () => {
    const prebuilt: Theme = {
      ...light,
      semantics: { ...light.semantics, textPrimary: '#00ff00' },
    };

    render(
      <StreamTheme
        mergedStyle={prebuilt}
        colorScheme="dark"
        style={{ semantics: { textPrimary: '#ff0000' } }}
      >
        <ThemeProbe />
      </StreamTheme>,
    );

    expect(textPrimary()).toBe('#00ff00');
  });
});
