import React from 'react';
import { Svg, Circle } from 'react-native-svg';

type Props = {
  color: string;
};

export const ThreeDots = ({ color }: Props) => (
  <Svg viewBox="0 0 24 24">
    <Circle cx="3.5" cy="12" r="2.5" fill={color} />
    <Circle cx="12" cy="12" r="2.5" fill={color} />
    <Circle cx="20.5" cy="12" r="2.5" fill={color} />
  </Svg>
);
