import React, { useMemo } from 'react';
import {
  StyleSheet,
  TextInput as NativeTextInput,
  TextInputProps,
} from 'react-native';
import { INPUT_HEIGHT } from '../constants';
import { useTheme } from '@stream-io/video-react-native-sdk';

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

TextInput.displayName = 'TextInput';

const useStyles = () => {
  const appTheme = useTheme().theme;
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
