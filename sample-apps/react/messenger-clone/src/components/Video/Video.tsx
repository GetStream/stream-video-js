import { ReactNode, useMemo } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  StreamMeeting,
  StreamVideo,
  useCalls,
  useCreateStreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';

import { CallPanel } from './CallPanel/CallPanel';
import { StreamChatType } from '../../types/chat';

export const Video = () => {
  const calls = useCalls();
  return (
    <>
      {calls.map((call) => (
        <StreamMeeting call={call} autoJoin={false} key={call.cid}>
          <CallPanel />
        </StreamMeeting>
      ))}
    </>
  );
};

const VideoAdapter = ({ children }: { children: ReactNode }) => {
  const { client } = useChatContext<StreamChatType>();

  const user = useMemo<User>(
    () => ({
      id: client.user!.id,
      name: client.user!.name,
      role: client.user!.role,
      image: client.user!.image,
    }),
    [client.user],
  );

  const videoClient = useCreateStreamVideoClient({
    apiKey: import.meta.env.VITE_STREAM_KEY,
    tokenOrProvider: client._getToken(),
    user,
  });

  return (
    <StreamVideo client={videoClient}>
      {children}
      <Video />
    </StreamVideo>
  );
};

export default VideoAdapter;
