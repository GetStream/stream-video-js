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
  token: string;
};

export const Video = ({
  children,
  user,
  token,
}: PropsWithChildren<VideoProps>) => {
  const client = useCreateStreamVideoClient({
    coordinatorRpcUrl: import.meta.env.VITE_VIDEO_COORDINATOR_RPC_ENDPOINT,
    coordinatorWsUrl: import.meta.env.VITE_VIDEO_COORDINATOR_WS_URL,
    apiKey: import.meta.env.VITE_VIDEO_API_KEY,
    token: import.meta.env.VITE_VIDEO_USER_TOKEN ?? token,
    user,
  });

  return (
    <StreamVideo client={client}>
      {children}
      <StreamCall leaveOnLeftAlone>
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
      imageUrl: client.user.image as string,
      teams: [],
      customJson: new Uint8Array(),
    }),
    [client.user],
  );

  return (
    <Video user={user} token={client._getToken()}>
      {children}
    </Video>
  );
};

export default VideoAdapter;
