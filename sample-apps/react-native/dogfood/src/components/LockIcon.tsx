import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';

/**
 * A small padlock glyph for the E2EE affordances (lobby notice + active-call
 * badge). The SDK icon set has no plain lock, so this mirrors the web app's
 * hand-rolled one rather than pulling in an asset.
 */
export const LockIcon = ({
  color,
  size = 16,
}: {
  color: ColorValue;
  size?: number;
}) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path
      d="M7 10V7a5 5 0 0 1 10 0v3"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Rect x={4.5} y={10} width={15} height={10} rx={2.5} fill={color} />
  </Svg>
);
