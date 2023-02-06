import { useEffect } from 'react';
import {
  useChatContext,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
} from 'stream-chat-react';
import { useParams } from 'react-router-dom';

export const ChatSidebar = () => {
  const { callId } = useParams();
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const channel = client.channel('videocall', callId);

    setActiveChannel(channel);
  }, [callId]);

  return (
    <div className="flex w-4/12">
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
      </Channel>
    </div>
  );
};
