import React from 'react';
import { type ColorValue } from 'react-native/types';
import Svg, { Path } from 'react-native-svg';

type IconProps = {
  color: ColorValue;
  width: number;
  height: number;
};

export const Maximize = ({ color, width, height }: IconProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3V5H4V9H2V3H8Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3H22V9H20V5H16V3Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 15H2V21H8V19H4V15Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 15V19H16V21H22V15H20Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
