import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { ColorValue } from 'react-native/types';
import { IconTestIds } from '../constants/TestIds';

type Props = {
  color: ColorValue;
  size: number;
};

export const PhoneDown = ({ color, size }: Props) => (
  <Svg
    viewBox={'0 0 24 24'}
    width={size}
    height={size}
    testID={IconTestIds.HANG_UP_CALL}
  >
    <Path
      d="M4.5801 16.5304L6.5801 14.9404C7.0601 14.5604 7.3401 13.9804 7.3401 13.3704V10.7704C10.3601 9.7904 13.6301 9.7804 16.6601 10.7704V13.3804C16.6601 13.9904 16.9401 14.5704 17.4201 14.9504L19.4101 16.5304C20.2101 17.1604 21.3501 17.1004 22.0701 16.3804L23.2901 15.1604C24.0901 14.3604 24.0901 13.0304 23.2401 12.2804C16.8301 6.6204 7.1701 6.6204 0.760103 12.2804C-0.089897 13.0304 -0.089897 14.3604 0.710103 15.1604L1.9301 16.3804C2.6401 17.1004 3.7801 17.1604 4.5801 16.5304Z"
      fill={color}
    />
  </Svg>
);
