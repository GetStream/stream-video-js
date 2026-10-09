import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { type ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
  size: number;
};

export const Language = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 26 26'} width={size} height={size} fill="none">
    <Path
      strokeWidth={1.5}
      d="M12.75 24.75C19.3774 24.75 24.75 19.3774 24.75 12.75C24.75 6.12258 19.3774 0.75 12.75 0.75M12.75 24.75C6.12258 24.75 0.75 19.3774 0.75 12.75C0.75 6.12258 6.12258 0.75 12.75 0.75M12.75 24.75C12.75 24.75 17.75 20.75 17.75 12.75C17.75 4.75 12.75 0.75 12.75 0.75M12.75 24.75C12.75 24.75 7.75 20.75 7.75 12.75C7.75 4.75 12.75 0.75 12.75 0.75M1.4325 8.75H24.0675M1.4325 16.75H24.0675"
      stroke={color}
    />
  </Svg>
);
