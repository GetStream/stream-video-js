import * as React from 'react';
import {
  MediaDevicesProvider,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { CALL_CONFIG } from '@stream-io/video-client';

import { UI } from './ui/UI';
import { useUserData } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';

export const VideoRoot = () => {
  const { selectedUserId, users } = useUserData();
  const { theme, toggleTheme } = useTheme();
  const client = useCreateStreamVideoClient({
    callConfig: CALL_CONFIG.meeting,
    apiKey: import.meta.env.VITE_STREAM_API_KEY,
    tokenOrProvider: import.meta.env[
      `VITE_STREAM_USER_${selectedUserId.toUpperCase()}_TOKEN`
    ],
    user: users[selectedUserId],
  });

  if (!client) {
    return null;
  }

  return (
    <StreamVideo client={client}>
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
    </StreamVideo>
  );
};
