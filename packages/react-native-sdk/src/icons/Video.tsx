import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const Video = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 26 26'} width={size} height={size}>
    <Path
      d="M19.8333 12.25V8.16667C19.8333 7.525 19.3083 7 18.6667 7H4.66667C4.025 7 3.5 7.525 3.5 8.16667V19.8333C3.5 20.475 4.025 21 4.66667 21H18.6667C19.3083 21 19.8333 20.475 19.8333 19.8333V15.75L22.505 18.4217C23.24 19.1567 24.5 18.6317 24.5 17.5933V10.395C24.5 9.35667 23.24 8.83167 22.505 9.56667L19.8333 12.25Z"
      fill={color}
    />
  </Svg>
);
