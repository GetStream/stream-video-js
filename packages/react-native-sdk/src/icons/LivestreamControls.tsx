import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type IconProps = {
  color: ColorValue;
  size: number;
};

export const VolumeOn = ({ color, size }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path
      d="M14 5.6v12.8c0 .88-1.04 1.32-1.66.8L7.5 15H5c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1h2.5l4.84-4.2c.62-.52 1.66-.08 1.66.8z"
      fill={color}
    />
    <Path
      d="M16.5 8.5c1 1 1.5 2.3 1.5 3.5s-.5 2.5-1.5 3.5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M18 6c1.5 1.5 2.5 3.6 2.5 6s-1 4.5-2.5 6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
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
