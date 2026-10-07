import React, { useMemo } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { BUTTON_HEIGHT } from '../constants';
import { useTheme } from '@stream-io/video-react-native-sdk';

type ButtonPropTypes = Omit<PressableProps, 'style'> & {
  title: string;
  buttonStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export const Button = ({
  disabled,
  title,
  buttonStyle,
  titleStyle,
  ...rest
}: ButtonPropTypes) => {
  const styles = useStyles();

  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={StyleSheet.flatten([
        styles.button,
        disabled ? styles.disabledButtonStyle : null,
        buttonStyle,
      ])}
    >
      <Text style={[styles.buttonText, titleStyle]}>{title}</Text>
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        button: {
          backgroundColor: semantics.accentPrimary,
          justifyContent: 'center',
          borderRadius: 8,
          height: BUTTON_HEIGHT,
          paddingHorizontal: primitives.spacingMd,
        },
        buttonText: {
          color: semantics.accentNeutral,
          textAlign: 'center',
          fontSize: primitives.typographyFontSizeMd,
        },
        disabledButtonStyle: {
          backgroundColor: semantics.backgroundUtilityDisabled,
        },
      }),
    [primitives, semantics],
  );
};
