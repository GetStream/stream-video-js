import React from 'react';
import { Svg, Path } from 'react-native-svg';

type Props = {
  color: string;
};

export const SpotLight = ({ color }: Props) => (
  <Svg viewBox="0 0 24 24">
    <Path
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M 12 22 C 17.5228 22 22 17.5228 22 12 C 22 6.47715 17.5228 2 12 2 C 6.47715 2 2 6.47715 2 12 C 2 17.5228 6.47715 22 12 22 Z M 12 24 C 18.6274 24 24 18.6274 24 12 C 24 5.37258 18.6274 0 12 0 C 5.37258 0 0 5.37258 0 12 C 0 18.6274 5.37258 24 12 24 Z"
    />
  </Svg>
);
