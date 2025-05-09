import React from 'react';
import { Svg, Path } from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
  fill?: string;
};

const QRCode = (props: Props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.width ?? 24}
    height={props.height ?? 24}
    fill={props.fill ?? '#FFFFFF'}
  >
    <Path d="M3 11V3H11V11H3ZM5 9H9V5H5V9ZM3 21V13H11V21H3ZM5 19H9V15H5V19ZM13 11V3H21V11H13ZM15 9H19V5H15V9ZM21 21H19V19H21V21ZM13 17V13H15V17H13ZM13 21V19H17V21H13ZM17 17H19V13H17V17Z" />
  </Svg>
);

export default QRCode;
