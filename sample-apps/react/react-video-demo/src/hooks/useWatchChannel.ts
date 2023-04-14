import { useState, useEffect } from 'react';
import type { Event, StreamChat } from 'stream-chat';

export const useWatchChannel = ({
  chatClient: client,
  channelType = 'videocall',
  channelId,
}: {
  chatClient?: StreamChat | null;
  channelId: string;
  channelType?: string;
}) => {
  const [channelWatched, setChannelWatched] = useState(false);

  const cid = `${channelType}:${channelId}`;

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

    const handleEvent = (event: Event) => {
      if (event?.cid === cid) setChannelWatched(true);
    };

    client.on('user.watching.start', handleEvent);
    return () => {
      client.off('user.watching.start', handleEvent);
    };
  }, [client, cid]);

  return channelWatched;
};
