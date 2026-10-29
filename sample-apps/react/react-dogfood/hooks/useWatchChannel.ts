import { useCallback, useEffect, useState } from 'react';
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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!client) return;
    const type = (router.query['channel_type'] as string) || channelType;
    const ch = client.channel(type, channelId);
    let cancelled = false;
    setFailed(false);

    ch.watch()
      .then((watched) => {
        if (!cancelled) setChannel(watched);
      })
      .catch((err) => {
        console.warn('Failed to watch chat channel', err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      setChannel(undefined);
    };
  }, [client, channelId, channelType, router.query, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { channel, channelWatched: !!channel, failed, retry };
};
