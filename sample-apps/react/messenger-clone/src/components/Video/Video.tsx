import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';

import { StreamChatType } from '../../types/chat';
import { CallPanel } from './CallPanel/CallPanel';

type VideoProps = {
  user: StreamChatType['userType'];
};

export const Video = ({ children, user }: PropsWithChildren<VideoProps>) => {
  const client = useCreateStreamVideoClient({
    coordinatorRpcUrl: import.meta.env.VITE_VIDEO_COORDINATOR_RPC_ENDPOINT,
    coordinatorWsUrl: import.meta.env.VITE_VIDEO_COORDINATOR_WS_URL,
    apiKey: import.meta.env.VITE_VIDEO_API_KEY,
    token: import.meta.env.VITE_VIDEO_USER_TOKEN,
    user,
  });

  return (
    <StreamVideo client={client}>
      {children}
      <StreamCall>
        <CallPanel />
      </StreamCall>
    </StreamVideo>
  );
};

const VideoAdapter = ({ children }: { children: ReactNode }) => {
  const { client } = useChatContext<StreamChatType>();

  const user = useMemo<VideoProps['user']>(
    () => ({
      id: client.user.id,
      name: client.user.name,
      role: client.user.role,
      imageUrl: client.user.imageUrl,
      teams: [],
      customJson: new Uint8Array(),
    }),
    [client.user],
  );

  return <Video user={user}>{children}</Video>;
};

export default VideoAdapter;
