import { PropsWithChildren, useState } from 'react';
import { Chat } from 'stream-chat-react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useUserContext } from './UserContext';
import { useCreateChatClient } from '../hooks';
import type { StreamChatType } from '../types/chat';
import type { User } from '../types/user';

export const ClientProviders = ({
  user,
  children,
}: PropsWithChildren<{ user: User }>) => {
  const { apiKey, token, tokenProvider } = useUserContext();
  const chatClient = useCreateChatClient<StreamChatType>({
    apiKey,
    tokenOrProvider: token || tokenProvider,
    userData: user,
  });
  const [videoClient] = useState<StreamVideoClient>(
    () => new StreamVideoClient({ apiKey, user, token, tokenProvider }),
  );

  if (!chatClient) return null;

  return (
    <Chat client={chatClient}>
      <StreamVideo client={videoClient}>{children}</StreamVideo>
    </Chat>
  );
};
