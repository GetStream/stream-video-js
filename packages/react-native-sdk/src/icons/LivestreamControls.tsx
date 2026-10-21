import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { ColorValue } from 'react-native';

type IconProps = {
  color: ColorValue;
  size: number;
};

export const VolumeOn = ({ color, size }: IconProps) => (
  <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none">
    <Path
      d="M15.625 8.125V11.875M18.125 6.875V13.125M6.875 13.125H3.125C2.95924 13.125 2.80027 13.0592 2.68306 12.9419C2.56585 12.8247 2.5 12.6658 2.5 12.5V7.5C2.5 7.33424 2.56585 7.17527 2.68306 7.05806C2.80027 6.94085 2.95924 6.875 3.125 6.875H6.875L12.5 2.5V17.5L6.875 13.125Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const VolumeOff = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path
      d="M14 5.6v12.8c0 .88-1.04 1.32-1.66.8L7.5 15H5c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1h2.5l4.84-4.2c.62-.52 1.66-.08 1.66.8z"
      fill={color}
    />
    <Path d="M3 3L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const PlayIcon = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M8 5v14l11-7z" fill={color} />
  </Svg>
);

export const PauseIcon = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill={color} />
  </Svg>
);
