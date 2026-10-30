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
  const type = (router.query['channel_type'] as string) || channelType;

  useEffect(() => {
    if (!client) return;
    const ch = client.channel(type, channelId);
    // active for the whole call, so connection recovery re-watches it while the
    // chat panel (whose Channel would activate it) is closed
    const release = ch.activate();
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
      release();
      setChannel(undefined);
    };
  }, [client, channelId, type, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { channel, channelWatched: !!channel, failed, retry };
};
