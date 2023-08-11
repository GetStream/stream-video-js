import React from 'react';
import {
  Svg,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  NumberProp,
} from 'react-native-svg';

type Props = {
  /**
   * Height of the SVG container
   */
  height?: NumberProp;
  /**
   * Width of the SVG container
   */
  width?: NumberProp;
};

export const TopViewBackground = ({ height, width }: Props) => (
  <Svg width={width} height={height} fill={'none'}>
    <Defs>
      <LinearGradient
        id="paint0_linear_8092_98095"
        x1={3}
        y1={0}
        x2={3}
        y2={height}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopOpacity={0.2} />
        <Stop offset={1} stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <Rect
      width={width}
      height={height}
      fill={'url(#paint0_linear_8092_98095)'}
    />
  </Svg>
);
