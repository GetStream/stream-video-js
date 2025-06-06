import React from 'react';
import { Svg, Path } from 'react-native-svg';

import type { ColorValue } from 'react-native';

type Props = {
  color: ColorValue;
  size?: number;
  enabled: boolean;
};

const Hearing = ({ color, size = 24, enabled }: Props) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path
      d="M17.527 20.165c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53-.53-.96-.82-2.01-.82-2.94 0-2.8 2.2-5 5-5 2.56 0 4.63 1.85 4.95 4.31.06.4.41.69.82.69h.34c.5 0 .89-.44.83-.94-.45-3.47-3.33-6.06-6.94-6.06-3.93 0-7 3.07-7 7 0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55a4.007 4.007 0 0 0 5.5-2.58.845.845 0 0 0-.81-1.07h-.35c-.38 0-.68.27-.81.63-.26.79-1.01 1.37-1.89 1.37ZM7.497 2.135a1.01 1.01 0 0 0-1.5.07c-1.54 1.9-2.47 4.32-2.47 6.96 0 2.64.93 5.06 2.47 6.95.38.46 1.07.5 1.49.08.36-.36.39-.93.07-1.32a9.034 9.034 0 0 1-2.03-5.71c0-2.17.77-4.16 2.04-5.7.33-.4.29-.97-.07-1.33Zm4.53 7.03a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0-5 0Z"
      fill={color}
    />
    {!enabled && (
      <Path
        d="M3 21 L21 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    )}
  </Svg>
);

export default Hearing;
