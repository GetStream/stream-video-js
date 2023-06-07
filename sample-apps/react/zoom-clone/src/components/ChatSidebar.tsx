import { useEffect } from 'react';
import {
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  useChatContext,
  Window,
} from 'stream-chat-react';
import { useParams } from 'react-router-dom';

import { DEFAULT_CHANNEL_TYPE } from '../utils';

const channelType = import.meta.env.VITE_CHANNEL_TYPE ?? DEFAULT_CHANNEL_TYPE;

export const ChatSidebar = () => {
  const { callId } = useParams();
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const channel = client.channel(channelType, callId);

    setActiveChannel(channel);
  }, [callId, client, setActiveChannel]);

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
