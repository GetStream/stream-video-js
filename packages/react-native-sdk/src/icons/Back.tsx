import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { type ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
  size?: number;
};

export const Back = ({ color, size = 20 }: Props) => (
  <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none">
    <Path
      d="M12.5 16.25L6.25 10L12.5 3.75"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke={color}
    />
  </Svg>
);
