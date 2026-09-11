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
  const {
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        input: {
          paddingLeft: primitives.spacingLg,
          height: INPUT_HEIGHT,
          backgroundColor: semantics.backgroundCoreApp,
          borderRadius: 8,
          borderColor: semantics.backgroundUtilityDisabled,
          borderWidth: 1,
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeMd,
          flex: 1,
        },
      }),
    [primitives, semantics],
  );
};
