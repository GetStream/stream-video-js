import React, { useMemo } from 'react';
import {
  TextInput as NativeTextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { INPUT_HEIGHT } from '../constants';
import {
  Theme,
  defaultTheme,
  useTheme,
} from '@stream-io/video-react-native-sdk';

export const TextInput = (
  props: Omit<TextInputProps, 'placeholderTextColor'>,
) => {
  const styles = useStyles();
  return (
    <NativeTextInput
      placeholderTextColor={'#8C8C8CFF'}
      {...props}
      style={[styles.input, props.style]}
    />
  );
};

const useStyles = () => {
  let appTheme: Theme;
  try {
    /* eslint-disable react-hooks/rules-of-hooks */
    appTheme = useTheme()?.theme;
  } catch (e) {
    appTheme = defaultTheme;
  }
  return useMemo(
    () =>
      StyleSheet.create({
        input: {
          paddingLeft: appTheme.variants.spacingSizes.lg,
          marginVertical: appTheme.variants.spacingSizes.md,
          height: INPUT_HEIGHT,
          backgroundColor: appTheme.colors.sheetSecondary,
          borderRadius: 8,
          borderColor: appTheme.colors.buttonPrimaryDisabled,
          borderWidth: 1,
          color: appTheme.colors.typePrimary,
          fontSize: 17,
          flex: 1,
        },
      }),
    [appTheme],
  );
};
