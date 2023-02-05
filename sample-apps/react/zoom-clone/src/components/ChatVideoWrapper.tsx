import {
  useCreateStreamVideoClient,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import { Chat } from 'stream-chat-react';

import { useChatClient } from '../hooks';

import type { User } from '../main';

import { Preview } from './Preview';
import { Outlet, useLoaderData } from 'react-router-dom';

const apiKey = import.meta.env.VITE_STREAM_KEY as string;
const coordinatorRpcUrl = import.meta.env.VITE_VIDEO_COORDINATOR_RPC_ENDPOINT;
const coordinatorWsUrl = import.meta.env.VITE_VIDEO_COORDINATOR_WS_URL;

export const ChatVideoWrapper = () => {
  const { token, ...userData } = useLoaderData() as User;

  const chatClient = useChatClient({
    apiKey,
    userData,
    tokenOrProvider: token,
  });

  const videoClient = useCreateStreamVideoClient({
    coordinatorRpcUrl,
    coordinatorWsUrl,
    apiKey,
    token,
    user: {
      id: userData.id,
      imageUrl: userData.image,
      name: userData.name,
      role: '',
      teams: [],
      customJson: new Uint8Array(),
    },
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
