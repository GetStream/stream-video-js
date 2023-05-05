import * as React from 'react';
import {
  MediaDevicesProvider,
  StreamCallProvider,
  useCalls,
} from '@stream-io/video-react-sdk';

import { UI } from './ui/UI';
import { useTheme } from '../hooks/useTheme';

export const VideoRoot = () => {
  const { theme, toggleTheme } = useTheme();
  const [currentCall] = useCalls();
  return (
    <StreamCallProvider call={currentCall}>
      <MediaDevicesProvider>
        <div className={`str-video str-video-tutorial ${theme}`}>
          <button
            onClick={toggleTheme}
            className={`str-video-tutorial__theme-btn ${theme}`}
          >
            {theme === 'dark' ? 'Go Light' : 'Go Dark'}
          </button>
          <UI />
        </div>
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
};
