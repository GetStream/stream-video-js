import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const BadNetwork = ({ color, size }: Props) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M24 0H0v24h24z" fill="none" />
    <Path
      d="M8.1 5c.17 0 .32.09.41.23l.07.15 5.18 11.65c.16.29.26.61.26.96 0 1.11-.9 2.01-2.01 2.01-.96 0-1.77-.68-1.96-1.59l-.01-.03L7.6 5.5c0-.28.22-.5.5-.5M23 9l-2 2a12.66 12.66 0 0 0-10.53-3.62L9.28 4.7c4.83-.86 9.98.57 13.72 4.3M3 11 1 9a15.4 15.4 0 0 1 5.59-3.57l.53 2.82C5.62 8.87 4.22 9.78 3 11m4 4-2-2c.8-.8 1.7-1.42 2.66-1.89l.55 2.92c-.42.27-.83.59-1.21.97m12-2-2 2a7.1 7.1 0 0 0-4.03-2l-1.28-2.88c2.63-.08 5.3.87 7.31 2.88"
      fill={color}
    />
  </Svg>
);
