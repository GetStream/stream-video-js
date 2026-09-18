import React from 'react';
import { type ColorValue } from 'react-native';
import { useTheme } from '../contexts';
import { IconWrapper } from './IconWrapper';

type IconComponent = React.ComponentType<{ color: ColorValue; size: number }>;

type Props = {
  icon: IconComponent;
  iconOff?: IconComponent;
  turnedOn?: boolean;
  disabled?: boolean;
};

export const ControlButtonIcon = ({
  icon,
  iconOff,
  turnedOn = true,
  disabled,
}: Props) => {
  const {
    theme: { components, semantics },
  } = useTheme();

  const color = disabled
    ? semantics.textDisabled
    : turnedOn
      ? semantics.buttonSecondaryText
      : semantics.buttonDestructiveTextOnAccent;

  const Icon = turnedOn ? icon : (iconOff ?? icon);

  return (
    <IconWrapper>
      <Icon color={color} size={components.iconSizeMd} />
    </IconWrapper>
  );
};
