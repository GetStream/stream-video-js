import { useEffect, useState } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  useChatContext,
} from 'stream-chat-react';
import { useParams } from 'react-router';

import { DEFAULT_CHANNEL_TYPE } from '../utils';

const channelType = import.meta.env.VITE_CHANNEL_TYPE ?? DEFAULT_CHANNEL_TYPE;

export const ChatSidebar = () => {
  const { callId } = useParams();
  const { client } = useChatContext();
  const [channel, setChannel] = useState<StreamChannel>();

  useEffect(() => {
    let cancelled = false;
    client
      .channel(channelType, callId)
      .watch()
      .then((watched) => {
        if (!cancelled) setChannel(watched);
      })
      .catch((err) => console.error('Failed to watch the call channel', err));
    return () => {
      cancelled = true;
    };
  }, [callId, client]);

  return (
    <div className="flex w-4/12">
      {channel && (
        <Channel channel={channel}>
          <ChannelHeader />
          <MessageList />
          <MessageComposer focus />
        </Channel>
      )}
    </div>
  );
};
