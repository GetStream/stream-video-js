import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { Channel, StreamChat } from 'stream-chat';

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
  const [channel, setChannel] = useState<Channel | undefined>();
  const router = useRouter();

  useEffect(() => {
    if (!client) return;
    const type = (router.query['channel_type'] as string) || channelType;
    const ch = client.channel(type, channelId);
    let cancelled = false;

    ch.watch()
      .then(() => {
        if (!cancelled) setChannel(ch);
      })
      .catch((err) => {
        console.warn('Failed to watch chat channel', err);
      });

    return () => {
      cancelled = true;
      setChannel(undefined);
    };
  }, [client, channelId, channelType, router.query]);

  return { channel, channelWatched: !!channel };
};
