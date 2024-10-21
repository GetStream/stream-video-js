import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const FullScreen = ({ color, size }: Props) => (
  <Svg viewBox={`0 0 24 24`} width={size} height={size}>
    <Path
      fill={color}
      d="M4.28613 18.0571C4.28613 19.162 4.82185 19.6977 5.88491 19.6977H18.0975C19.1606 19.6977 19.6963 19.162 19.6963 18.0571V5.91802C19.6963 4.81311 19.1606 4.28577 18.0975 4.28577H5.88491C4.82185 4.28577 4.28613 4.81311 4.28613 5.91802V18.0571ZM12.9019 12.6773C11.8389 12.6773 11.3032 12.15 11.3032 11.045V7.29505C11.3032 6.19851 11.8389 5.66279 12.9019 5.66279H16.7189C17.7819 5.66279 18.3177 6.19851 18.3177 7.29505V11.045C18.3177 12.15 17.7819 12.6773 16.7189 12.6773H12.9019Z"
    />
  </Svg>
);
