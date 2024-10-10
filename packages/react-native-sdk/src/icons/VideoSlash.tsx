import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';
import { IconTestIds } from '../constants/TestIds';

type Props = {
  color: ColorValue;
  size: number;
};

export const VideoSlash = ({ color, size }: Props) => (
  <Svg
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    height={size}
    testID={IconTestIds.MUTED_VIDEO}
  >
    <Path
      d="M24.8397 17.7317V11.56C24.8397 10.5217 23.5797 9.99667 22.8447 10.7317L20.1731 13.415V9.33167C20.1731 8.69001 19.6481 8.16501 19.0064 8.16501H12.4614L22.8564 18.56C23.5797 19.295 24.8397 18.77 24.8397 17.7317ZM3.50141 4.15167C3.04641 4.60667 3.04641 5.34167 3.50141 5.79667L5.85807 8.16501H5.00641C4.36474 8.16501 3.83974 8.69001 3.83974 9.33167V20.9983C3.83974 21.64 4.36474 22.165 5.00641 22.165H19.0064C19.2514 22.165 19.4614 22.0717 19.6481 21.955L22.5414 24.8483C22.9964 25.3033 23.7314 25.3033 24.1864 24.8483C24.6414 24.3933 24.6414 23.6583 24.1864 23.2033L5.14641 4.15167C4.69141 3.69667 3.95641 3.69667 3.50141 4.15167Z"
      fill={color}
    />
  </Svg>
);
