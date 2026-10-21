import React from 'react';
import { Path, Svg, SvgProps } from 'react-native-svg';
import { type ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
  size?: number;
} & Pick<SvgProps, 'style'>;

export const Leave = ({ color, size = 20, style }: Props) => (
  <Svg
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    style={style}
    fill="none"
  >
    <Path
      d="M8.75 3.125H3.75V16.875H8.75M8.75 10H17.5M14.375 13.125L17.5 10L14.375 6.875"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
