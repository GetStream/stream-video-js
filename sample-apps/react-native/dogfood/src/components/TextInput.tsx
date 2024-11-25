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

export const TextInput = React.forwardRef<
  NativeTextInput,
  Omit<TextInputProps, 'placeholderTextColor'>
>((props, ref) => {
  const styles = useStyles();
  return (
    <NativeTextInput
      ref={ref}
      placeholderTextColor={'#8C8C8CFF'}
      {...props}
      style={[styles.input, props.style]}
    />
  );
});

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
          borderColor: appTheme.colors.buttonDisabled,
          borderWidth: 1,
          color: appTheme.colors.textPrimary,
          fontSize: 17,
          flex: 1,
        },
      }),
    [appTheme],
  );
};
