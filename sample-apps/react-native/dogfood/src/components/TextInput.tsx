import React from 'react';
import {
  TextInput as NativeTextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { appTheme } from '../theme';
import { INPUT_HEIGHT } from '../constants';

type TextInputPropsType = TextInputProps & {
  textInputStyle?: TextInputProps['style'];
};

export const TextInput = ({ textInputStyle, ...rest }: TextInputPropsType) => {
  return <NativeTextInput {...rest} style={[styles.input, textInputStyle]} />;
};

const styles = StyleSheet.create({
  input: {
    paddingLeft: appTheme.spacing.lg,
    marginVertical: appTheme.spacing.md,
    height: INPUT_HEIGHT,
    backgroundColor: appTheme.colors.dark_gray,
    borderRadius: 8,
    borderColor: appTheme.colors.disabled,
    borderWidth: 1,
    color: appTheme.colors.static_white,
    fontSize: 17,
    flex: 1,
  },
});
