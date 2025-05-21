import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const StopScreenShare = ({ color, size }: Props) => {
  return (
    <Svg viewBox="0 0 25 25" width={size} height={size}>
      <Path
        fill={color}
        d="M21.478 19.1H3.47803V5H21.478V19.1ZM21.478 3H3.47803C2.37803 3 1.47803 3.9 1.47803 5V19C1.47803 20.1 2.37803 21 3.47803 21H21.478C22.578 21 23.478 20.1 23.478 19V5C23.478 3.9 22.578 3 21.478 3Z"
      />
      <Path
        fill={color}
        d="M15.068 8L12.478 10.59L9.88803 8L8.47803 9.41L11.068 12L8.47803 14.59L9.88803 16L12.478 13.41L15.068 16L16.478 14.59L13.888 12L16.478 9.41L15.068 8Z"
      />
    </Svg>
  );
};
