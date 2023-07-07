import { PropsWithChildren, useEffect, useState } from 'react';
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
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const client = new StreamVideoClient({
      apiKey,
      user,
      token,
      tokenProvider,
    });
    setVideoClient(client);

    return () => {
      client
        .disconnectUser()
        .catch((error) => console.error(`Couldn't disconnect user`, error));
      setVideoClient(undefined);
    };
  }, [user]);

  if (!chatClient) return null;

  return (
    <Chat client={chatClient}>
      <StreamVideo client={videoClient}>{children}</StreamVideo>
    </Chat>
  );
};
