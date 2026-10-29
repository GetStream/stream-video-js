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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    client
      .channel(channelType, callId)
      .watch()
      .then((watched) => {
        if (!cancelled) setChannel(watched);
      })
      .catch((err) => {
        console.error('Failed to watch the call channel', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [callId, client, attempt]);

  return (
    <div className="flex w-4/12">
      {failed && !channel && (
        <div className="flex flex-col w-full gap-2 justify-center items-center">
          <span>Couldn't load the chat.</span>
          <button
            className="px-4 py-1 bg-cyan-600 text-white rounded-full"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}
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
