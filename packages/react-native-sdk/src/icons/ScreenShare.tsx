import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { type ColorValue } from 'react-native/types';
import { IconTestIds } from '../constants/TestIds';

type Props = {
  color: ColorValue;
  size: number;
};

export const ScreenShare = ({ color, size }: Props) => {
  return (
    <Svg
      viewBox={'0 0 24 24'}
      width={size}
      height={size}
      testID={IconTestIds.SCREEN_SHARE}
    >
      <Path
        fill={color}
        d="M18.2964 1.01L8.29636 1C7.19636 1 6.29636 1.9 6.29636 3V6C6.29636 6.55 6.74636 7 7.29636 7C7.84636 7 8.29636 6.55 8.29636 6V5H18.2964V19H8.29636V18C8.29636 17.45 7.84636 17 7.29636 17C6.74636 17 6.29636 17.45 6.29636 18V21C6.29636 22.1 7.19636 23 8.29636 23H18.2964C19.3964 23 20.2964 22.1 20.2964 21V3C20.2964 1.9 19.3964 1.01 18.2964 1.01ZM11.2964 15C11.8464 15 12.2964 14.55 12.2964 14V9C12.2964 8.45 11.8464 8 11.2964 8H6.29636C5.74636 8 5.29636 8.45 5.29636 9C5.29636 9.55 5.74636 10 6.29636 10H8.88636L3.99636 14.89C3.60636 15.28 3.60636 15.91 3.99636 16.3C4.38636 16.69 5.01636 16.69 5.40636 16.3L10.2964 11.41V14C10.2964 14.55 10.7464 15 11.2964 15Z"
      />
    </Svg>
  );
};
