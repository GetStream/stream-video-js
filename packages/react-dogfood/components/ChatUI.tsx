import { useEffect } from 'react';
import {
  useChatContext,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
} from 'stream-chat-react';

export const ChatUI = ({ callId }: { callId: string }) => {
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const channel = client.channel('videocall', callId);

    setActiveChannel(channel);
  }, [callId]);

  return (
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput focus />
      </Window>
    </Channel>
  );
};
