import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const CameraSwitch = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 24 24'} width={size} height={size}>
    <Path
      d="M20 5.5H16.83L15.59 4.15C15.22 3.74 14.68 3.5 14.12 3.5H9.88C9.32 3.5 8.78 3.74 8.4 4.15L7.17 5.5H4C2.9 5.5 2 6.4 2 7.5V19.5C2 20.6 2.9 21.5 4 21.5H20C21.1 21.5 22 20.6 22 19.5V7.5C22 6.4 21.1 5.5 20 5.5ZM13.67 18.2C13.15 18.39 12.59 18.5 12 18.5C9.24 18.5 7 16.26 7 13.5H5L7.5 11L10 13.5H8C8 15.71 9.79 17.5 12 17.5C12.46 17.5 12.91 17.42 13.32 17.27C13.51 17.2 13.71 17.24 13.85 17.38C14.11 17.64 14.01 18.07 13.67 18.2ZM16.5 16L14 13.5H16C16 11.29 14.21 9.5 12 9.5C11.54 9.5 11.09 9.58 10.68 9.73C10.49 9.8 10.29 9.76 10.15 9.62C9.89 9.36 9.99 8.93 10.33 8.8C10.85 8.61 11.41 8.5 12 8.5C14.76 8.5 17 10.74 17 13.5H19L16.5 16Z"
      fill={color}
    />
  </Svg>
);
