import React from 'react';
import { Svg, Path } from 'react-native-svg';

type Props = {
  color: string;
};

export const Chat = ({ color }: Props) => (
  <Svg viewBox="0 0 21 20">
    <Path
      d="M 17.1887 0.353516 H 2.37385 C 1.35534 0.353516 0.522003 1.18685 0.522003 2.20537 V 18.872 L 4.22571 15.1683 H 17.1887 C 18.2072 15.1683 19.0405 14.335 19.0405 13.3165 V 2.20537 C 19.0405 1.18685 18.2072 0.353516 17.1887 0.353516 Z M 17.1887 13.3165 H 4.22571 L 2.37385 15.1683 V 2.20537 H 17.1887 V 13.3165 Z"
      fill={color}
    />
  </Svg>
);
