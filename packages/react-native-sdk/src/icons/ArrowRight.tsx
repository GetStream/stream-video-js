import React from 'react';
import { Svg, Path } from 'react-native-svg';

type Props = {
  color: string;
};

export const ArrowRight = ({ color }: Props) => (
  <Svg viewBox="0 0 8 15">
    <Path
      clipRule="evenodd"
      fillRule="evenodd"
      d="M 0.553016 2.50028 L 5.3299 7.5 L 0.553016 12.4997 C 0.111957 12.9585 0.111957 13.6972 0.553016 14.1559 C 0.994074 14.6147 1.71173 14.6147 2.14531 14.1559 L 7.66975 8.37864 C 7.9015 8.1376 8.01363 7.8188 7.99868 7.5 C 8.01363 7.1812 7.9015 6.8624 7.66975 6.62136 L 2.14531 0.84407 C 1.70425 0.385308 0.986598 0.385308 0.553016 0.84407 C 0.111957 1.30283 0.111957 2.04152 0.553016 2.50028 Z"
      fill={color}
    />
  </Svg>
);
