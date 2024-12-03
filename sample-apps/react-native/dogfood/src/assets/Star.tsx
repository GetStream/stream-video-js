import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

const Star = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 68 67'} width={size} height={size}>
    <Path
      d="M40.8853 26.8323L36.7203 13.3206C35.8987 10.6685 32.102 10.6685 31.3087 13.3206L27.1153 26.8323H14.507C11.7587 26.8323 10.6253 30.3219 12.8637 31.8852L23.177 39.1435L19.1253 52.0131C18.3037 54.6094 21.3637 56.7031 23.5453 55.056L34.0003 47.2394L44.4553 55.0839C46.637 56.731 49.697 54.6373 48.8753 52.041L44.8237 39.1714L55.137 31.9131C57.3753 30.3219 56.242 26.8602 53.4937 26.8602H40.8853V26.8323Z"
      fill={color}
    />
  </Svg>
);

export default Star;
