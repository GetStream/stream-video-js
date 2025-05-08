import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
  size: number;
};

const Screenshot = ({ color, size }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 4h-3.09c-.36 0-.71.12-.99.35L14.5 6H9.5L8.09 4.35C7.8 4.12 7.46 4 7.09 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Screenshot;
