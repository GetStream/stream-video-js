import { useEffect, useMemo, useState } from 'react';
import type { UserResponse } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import {
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { Channel } from './components/Channel';
import { Sidebar } from './components/Sidebar';
import { Video } from './components/Video';
import { UserList } from './components/UserList';
import { useCreateChatClient } from './hooks';
import { userFromToken } from './utils/userFromToken';

import './styles/index.scss';

import type { StreamChatType } from './types/chat';

const App = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, property) => searchParams.get(property as string),
  }) as unknown as Record<string, string | null>;

  const apiKey = import.meta.env.VITE_STREAM_KEY as string;

  const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);

  const user = useMemo(() => userFromToken(userToken), [userToken]);

  if (!user?.id) return <UserList />;

  return <Root apiKey={apiKey} user={user} userToken={userToken} />;
};

const Root = ({
  apiKey,
  user,
  userToken,
}: {
  apiKey: string;
  user: UserResponse<StreamChatType>;
  userToken: string;
}) => {
  const chatClient = useCreateChatClient<StreamChatType>({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });
  const [videoClient] = useState<StreamVideoClient>(
    () => new StreamVideoClient(apiKey),
  );

  useEffect(() => {
    videoClient.connectUser(user, userToken).catch(console.error);

    return () => {
      videoClient.disconnectUser();
    };
  }, [videoClient, user, userToken]);

  if (!chatClient) return null;

  return (
    <StreamTheme as="main" className="main-container">
      <Chat client={chatClient}>
        <StreamVideo client={videoClient}>
          <Sidebar user={user} />
          <Channel />
          <Video />
        </StreamVideo>
      </Chat>
    </StreamTheme>
  );
};

export default App;
