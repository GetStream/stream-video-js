import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

const ClosedCaptions = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 24 24'} width={size} height={size}>
    <Path
      d="M19 4H5C3.89 4 3 4.9 3 6V18C3 19.1 3.89 20 5 20H19C20.1 20 21 19.1 21 18V6C21 4.9 20.1 4 19 4ZM11 10.5C11 10.78 10.78 11 10.5 11H10C9.72 11 9.5 10.78 9.5 10.5H7.5V13.5H9.5C9.5 13.22 9.72 13 10 13H10.5C10.78 13 11 13.22 11 13.5V14C11 14.55 10.55 15 10 15H7C6.45 15 6 14.55 6 14V10C6 9.45 6.45 9 7 9H10C10.55 9 11 9.45 11 10V10.5ZM18 10.5C18 10.78 17.78 11 17.5 11H17C16.72 11 16.5 10.78 16.5 10.5H14.5V13.5H16.5C16.5 13.22 16.72 13 17 13H17.5C17.78 13 18 13.22 18 13.5V14C18 14.55 17.55 15 17 15H14C13.45 15 13 14.55 13 14V10C13 9.45 13.45 9 14 9H17C17.55 9 18 9.45 18 10V10.5Z"
      fill={color}
    />
  </Svg>
);

export default ClosedCaptions;
