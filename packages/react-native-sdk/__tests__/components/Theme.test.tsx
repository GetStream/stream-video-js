import { defaultTheme } from '../../src';

describe('theme.get()', () => {
  let theme: typeof defaultTheme;

  beforeEach(() => {
    // GIVEN: Initialize the theme with overridden properties
    theme = {
      ...defaultTheme,
      participantLabel: {
        ...defaultTheme.participantLabel,
        userNameLabel: {
          fontSize: 18,
        },
      },
    };
  });

  test('should return a deeply nested value using a valid path', () => {
    // WHEN
    const color = theme.get('colors.primary');

    // THEN
    expect(color).toBe(theme.colors.primary);
  });

  test('should return the default value for a simple valid path', () => {
    // WHEN
    const padding = theme.get('defaults.padding');

    // THEN
    expect(padding).toBe(theme.defaults.padding);
  });

  test('should return undefined for an invalid path', () => {
    const consoleSpy = jest.spyOn(console, 'error');

    // WHEN
    const result = theme.get('nonexistent.path');

    // THEN
    expect(consoleSpy).toHaveBeenCalledWith('Invalid path: nonexistent.path');
    expect(result).toBeUndefined();
  });

  test('should log an error for an invalid path', () => {
    const consoleSpy = jest.spyOn(console, 'error');

    // WHEN
    theme.get('button.invalidProp');

    // THEN
    expect(consoleSpy).toHaveBeenCalledWith('Invalid path: button.invalidProp');
    consoleSpy.mockRestore();
  });

  test('should return a nested ViewStyle property', () => {
    // WHEN
    const containerStyle = theme.get('callControls.container');

    // THEN
    expect(containerStyle).toBe(theme.callControls.container);
  });

  test('should return undefined for a valid component but invalid property', () => {
    // WHEN
    const result = theme.get('callControls.nonexistentProp');

    // THEN
    expect(result).toBeUndefined();
  });

  test('should return undefined for an empty string path', () => {
    // WHEN
    const result = theme.get('');

    // THEN
    expect(result).toBeUndefined();
  });

  test('should handle paths with only one level correctly', () => {
    // GIVEN
    const component = 'defaults';
    const prop = 'color';

    // WHEN
    const result = theme.get(component, prop);

    // THEN
    expect(result).toEqual(theme.defaults.color);
  });

  test('should return a nested text style property', () => {
    // WHEN
    const textStyle = theme.get('participantLabel.userNameLabel');

    // THEN
    expect(textStyle).toBe(theme.participantLabel.userNameLabel);
  });

  test('should return undefined if one part of the path is invalid', () => {
    // WHEN
    const result = theme.get('participantLabel.nonexistentProp.text');

    // THEN
    expect(result).toBeUndefined();
  });
});
