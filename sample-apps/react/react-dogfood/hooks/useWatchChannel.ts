import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();

  useEffect(() => {
    if (!client) return;
    const type = (router.query['channel_type'] as string) || channelType;
    const channel = client.channel(type, channelId);
    // initiate watching now so we can receive message events
    const watchingPromise = channel.watch();

    return () => {
      watchingPromise.then(() => {
        // channel.stopWatching();
      });
    };
  }, [client, channelId, channelType, router.query]);

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
