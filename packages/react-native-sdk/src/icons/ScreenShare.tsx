import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';
import { IconTestIds } from '../constants/TestIds';

type Props = {
  color: ColorValue;
};

export const ScreenShare = ({ color }: Props) => {
  return (
    <Svg viewBox="0 0 36 36" testID={IconTestIds.SCREEN_SHARE}>
      <Path
        fill={color}
        d="m25.407 1.718-14.814-.014a2.959 2.959 0 0 0-2.948 2.963v26.666a2.959 2.959 0 0 0 2.948 2.963h14.814a2.972 2.972 0 0 0 2.963-2.963V4.667a2.96 2.96 0 0 0-2.963-2.949Zm0 26.652H10.593V7.63h14.814v20.74Zm-6.222-8.563V22.4l4.741-4.43-4.74-4.414v2.518c-4.608.637-6.445 3.793-7.112 6.963 1.645-2.222 3.822-3.23 7.111-3.23Z"
      />
    </Svg>
  );
};
