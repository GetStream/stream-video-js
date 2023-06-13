import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { Chat } from 'stream-chat-react';

import { useChatClient } from '../hooks';

import type { User } from '../main';

import { Preview } from './Preview';
import { Outlet, useLoaderData } from 'react-router-dom';
import { useState } from 'react';

const apiKey = import.meta.env.VITE_STREAM_KEY as string;

export const ChatVideoWrapper = () => {
  const { token, ...userData } = useLoaderData() as User;
  const [videoClient] = useState(
    () =>
      new StreamVideoClient({
        apiKey,
        user: {
          id: userData.id,
          image: userData.image,
          name: userData.name,
          role: 'user',
          teams: [],
        },
        token,
      }),
  );

  const chatClient = useChatClient({
    apiKey,
    userData,
    tokenOrProvider: token,
  });

  if (!chatClient || !videoClient) return null;

  return (
    <Chat theme="str-chat__theme-dark" client={chatClient}>
      <StreamVideo client={videoClient}>
        <Preview.Provider>
          <Outlet />
        </Preview.Provider>
      </StreamVideo>
    </Chat>
  );
};
