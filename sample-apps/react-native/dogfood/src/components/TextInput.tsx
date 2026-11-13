import React, { useMemo } from 'react';
import {
  StyleSheet,
  TextInput as NativeTextInput,
  TextInputProps,
  type TextInputInstance,
} from 'react-native';
import { INPUT_HEIGHT } from '../constants';
import { useTheme } from '@stream-io/video-react-native-sdk';

type Props = Omit<TextInputProps, 'placeholderTextColor'> & {
  ref?: React.Ref<TextInputInstance>;
};

export const TextInput = ({ ref, ...props }: Props) => {
  const styles = useStyles();
  return (
    <NativeTextInput
      ref={ref}
      placeholderTextColor={'#8C8C8CFF'}
      {...props}
      style={[styles.input, props.style]}
    />
  );
};

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
