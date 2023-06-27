import { PropsWithChildren, useState } from 'react';
import { Chat } from 'stream-chat-react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useUserContext } from './UserContext';
import { useChatClient } from '../hooks';

import type { User } from '../types';

export const ClientProviders = ({
  user,
  children,
}: PropsWithChildren<{ user: User }>) => {
  const { apiKey, token, tokenProvider } = useUserContext();
  const chatClient = useChatClient({
    apiKey,
    tokenOrProvider: token || tokenProvider,
    user,
  });
  const [videoClient] = useState<StreamVideoClient>(
    () => new StreamVideoClient({ apiKey, user, token, tokenProvider }),
  );

  if (!chatClient) return null;

  return (
    <Chat theme="str-chat__theme-dark" client={chatClient}>
      <StreamVideo client={videoClient}>{children}</StreamVideo>
    </Chat>
  );
};
