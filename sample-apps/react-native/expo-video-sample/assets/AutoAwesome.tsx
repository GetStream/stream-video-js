import React from 'react';
import { Svg, Path } from 'react-native-svg';

import type { ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
  size?: number;
};

const AutoAwesome = ({ color, size = 24 }: Props) => (
  <Svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
  </Svg>
);

export default AutoAwesome;
