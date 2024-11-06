import React, { useMemo } from 'react';
import {
  TextInput as NativeTextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { appTheme } from '../theme';
import { INPUT_HEIGHT } from '../constants';
import { useTheme } from '@stream-io/video-react-native-sdk';

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
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        input: {
          paddingLeft: appTheme.spacing.lg,
          marginVertical: appTheme.spacing.md,
          height: INPUT_HEIGHT,
          backgroundColor: theme.colors.sheetSecondary,
          borderRadius: 8,
          borderColor: theme.colors.buttonPrimaryDisabled,
          borderWidth: 1,
          color: theme.colors.typePrimary,
          fontSize: 17,
          flex: 1,
        },
      }),
    [theme],
  );
};
