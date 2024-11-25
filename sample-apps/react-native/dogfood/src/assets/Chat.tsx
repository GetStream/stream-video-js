import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

const Chat = ({ color, size }: Props) => (
  <Svg viewBox={'0 0 24 24'} width={size} height={size}>
    <Path
      d="M23.333 7.00004H22.1663V16.3334C22.1663 16.975 21.6413 17.5 20.9997 17.5H6.99967V18.6667C6.99967 19.95 8.04967 21 9.33301 21H20.9997L25.6663 25.6667V9.33337C25.6663 8.05004 24.6163 7.00004 23.333 7.00004ZM19.833 12.8334V4.66671C19.833 3.38337 18.783 2.33337 17.4997 2.33337H4.66634C3.38301 2.33337 2.33301 3.38337 2.33301 4.66671V19.8334L6.99967 15.1667H17.4997C18.783 15.1667 19.833 14.1167 19.833 12.8334Z"
      fill={color}
    />
  </Svg>
);

export default Chat;
