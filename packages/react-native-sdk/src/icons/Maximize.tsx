import React from 'react';
import { type ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type IconProps = {
  color: ColorValue;
  size: number;
};

export const Maximize = ({ color, size }: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <Path
        d="M13.125 3.75H16.25V6.875M6.875 16.25H3.75V13.125M16.25 13.125V16.25H13.125M3.75 6.875V3.75H6.875"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
