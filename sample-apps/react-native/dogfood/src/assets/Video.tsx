import React from 'react';
import { Svg, Path } from 'react-native-svg';

import { ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
};


export const Video = ({ color }: Props) => (
  <Svg viewBox="0 0 29 19">
    <Path
      d="M4.725 18.635h11.741c2.411 0 3.795-1.35 3.795-3.717V3.958c0-2.366-1.295-3.716-3.705-3.716H4.726C2.403.242.93 1.592.93 3.958v11.038c0 2.355 1.395 3.639 3.794 3.639Zm17.177-5.603 3.817 3.281c.457.402.948.659 1.417.659.904 0 1.518-.648 1.518-1.63V3.59c0-.982-.614-1.63-1.518-1.63-.48 0-.96.257-1.417.659L21.902 5.9v7.132Z"
      fill={color}
    />
  </Svg>
);
