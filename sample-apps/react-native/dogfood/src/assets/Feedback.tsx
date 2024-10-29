import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

const Feedback = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 24 24'} width={size} height={size}>
    <Path
      d="M19.9949 2H4.00488C2.90488 2 2.00488 2.9 2.00488 4V22L5.99488 18H19.9949C21.0949 18 21.9949 17.1 21.9949 16V4C21.9949 2.9 21.0949 2 19.9949 2ZM12.9949 14H10.9949V12H12.9949V14ZM12.9949 9C12.9949 9.55 12.5449 10 11.9949 10C11.4449 10 10.9949 9.55 10.9949 9V7C10.9949 6.45 11.4449 6 11.9949 6C12.5449 6 12.9949 6.45 12.9949 7V9Z"
      fill={color}
    />
  </Svg>
);

export default Feedback;
