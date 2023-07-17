import { useEffect, useState } from 'react';
import type { Event, StreamChat } from 'stream-chat';

import { CHANNEL_TYPE } from '../components';

export const useWatchChannel = ({
  chatClient: client,
  channelType = CHANNEL_TYPE,
  channelId,
}: {
  chatClient?: StreamChat | null;
  channelId?: string;
  channelType?: string;
}) => {
  const [channelWatched, setChannelWatched] = useState(false);

  useEffect(() => {
    if (!client) return;

    const channel = client.channel(channelType, channelId);
    // initiate watching now so we can receive message events
    const watchingPromise = channel.watch();

    return () => {
      watchingPromise.then(() => {
        // channel.stopWatching();
      });
    };
  }, [client, channelId, channelType]);

  useEffect(() => {
    if (!client) return;
    const cid = `${channelType}:${channelId}`;
    const handleEvent = (event: Event) => {
      if (event?.cid === cid) setChannelWatched(true);
    };

    client.on('user.watching.start', handleEvent);
    return () => {
      client.off('user.watching.start', handleEvent);
    };
  }, [client, channelType, channelId]);

  return channelWatched;
};
