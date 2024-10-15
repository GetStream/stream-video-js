import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const FlipCamera = ({ color, size }: Props) => (
  <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
    <Path
      d="M20 5H16.83L15.59 3.65C15.22 3.24 14.68 3 14.12 3H9.88C9.32 3 8.78 3.24 8.4 3.65L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM13.67 17.7C13.15 17.89 12.59 18 12 18C9.24 18 7 15.76 7 13H5L7.5 10.5L10 13H8C8 15.21 9.79 17 12 17C12.46 17 12.91 16.92 13.32 16.77C13.51 16.7 13.71 16.74 13.85 16.88C14.11 17.14 14.01 17.57 13.67 17.7ZM16.5 15.5L14 13H16C16 10.79 14.21 9 12 9C11.54 9 11.09 9.08 10.68 9.23C10.49 9.3 10.29 9.26 10.15 9.12C9.89 8.86 9.99 8.43 10.33 8.3C10.85 8.11 11.41 8 12 8C14.76 8 17 10.24 17 13H19L16.5 15.5Z"
      fill={color}
    />
  </Svg>
);
