import { useMemo } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';

import { CallConfig, useCallController } from '../../context';

import { StreamChatType } from '../../types/chat';

type VideoProps = {
  call: CallConfig;
  user: StreamChatType['userType'];
};

export const Video = ({ call, user }: VideoProps) => {
  const client = useCreateStreamVideoClient({
    coordinatorRpcUrl: import.meta.env.VITE_VIDEO_COORDINATOR_RPC_ENDPOINT,
    coordinatorWsUrl: import.meta.env.VITE_VIDEO_COORDINATOR_WS_URL,
    apiKey: import.meta.env.VITE_VIDEO_API_KEY,
    token: import.meta.env.VITE_VIDEO_USER_TOKEN,
    user,
  });

  return (
    <StreamVideo client={client}>
      {call.id && (
        <StreamCall
          callId={call.id}
          callType={call.type}
          input={call.input}
          currentUser={user.id}
        />
      )}
    </StreamVideo>
  );
};

const VideoAdapter = () => {
  const { client } = useChatContext<StreamChatType>();
  const { call } = useCallController();

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

  return <Video user={user} call={call} />;
};

export default VideoAdapter;
