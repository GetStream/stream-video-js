import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';
import { IconTestIds } from '../constants/TestIds';

type Props = {
  color: ColorValue;
  size: number;
};

export const VideoSlash = ({ color, size }: Props) => (
  <Svg
    viewBox={'0 0 25 25'}
    width={size}
    height={size}
    testID={IconTestIds.MUTED_VIDEO}
  >
    <Path
      d="M21.7912 15.27V9.97999C21.7912 9.08999 20.7112 8.63999 20.0812 9.26999L17.7912 11.57V8.06999C17.7912 7.51999 17.3412 7.06999 16.7912 7.06999H11.1812L20.0912 15.98C20.7112 16.61 21.7912 16.16 21.7912 15.27ZM3.50124 3.62999C3.11124 4.01999 3.11124 4.64999 3.50124 5.03999L5.52124 7.06999H4.79124C4.24124 7.06999 3.79124 7.51999 3.79124 8.06999V18.07C3.79124 18.62 4.24124 19.07 4.79124 19.07H16.7912C17.0012 19.07 17.1812 18.99 17.3412 18.89L19.8212 21.37C20.2112 21.76 20.8412 21.76 21.2312 21.37C21.6212 20.98 21.6212 20.35 21.2312 19.96L4.91124 3.62999C4.52124 3.23999 3.89124 3.23999 3.50124 3.62999Z"
      fill={color}
    />
  </Svg>
);
