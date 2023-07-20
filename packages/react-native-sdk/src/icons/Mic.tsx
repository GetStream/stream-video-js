import React from 'react';
import { Svg, Path } from 'react-native-svg';

type Props = {
  color: string;
};

export const Mic = ({ color }: Props) => (
  <Svg viewBox="0 0 22 28">
    <Path
      d="M11 17.6c2.459 0 4.444-1.923 4.444-4.305V4.683C15.444 2.301 13.46.378 11 .378 8.54.378 6.555 2.3 6.555 4.683v8.612c0 2.382 1.986 4.305 4.445 4.305Z"
      fill={color}
    />
    <Path
      d="M18.407 13.295c0 3.96-3.318 7.176-7.407 7.176-4.09 0-7.408-3.215-7.408-7.176H.63c0 5.066 3.867 9.228 8.89 9.931v4.42h2.962v-4.42c5.022-.703 8.89-4.865 8.89-9.931h-2.964Z"
      fill={color}
    />
  </Svg>
);
