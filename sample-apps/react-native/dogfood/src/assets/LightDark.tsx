import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

const LightDark = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 24 24'} width={size} height={size}>
    <Path
      d="M12,22 C17.5228475,22 22,17.5228475 22,12 C22,6.4771525 17.5228475,2 12,2 C6.4771525,2 2,6.4771525 2,12 C2,17.5228475 6.4771525,22 12,22 Z M12,20.5 L12,3.5 C16.6944204,3.5 20.5,7.30557963 20.5,12 C20.5,16.6944204 16.6944204,20.5 12,20.5 Z"
      fill={color}
    />
  </Svg>
);

export default LightDark;
