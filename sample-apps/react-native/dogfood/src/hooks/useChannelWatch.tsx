import { useCall } from '@stream-io/video-react-native-sdk';
import { useEffect, useState } from 'react';
import { useChatContext } from 'stream-chat-react-native';
import type { Event } from 'stream-chat';

/**
 * This hook is responsible for creating the channel and watching it.
 * It also makes sure to return the state whether the channel is being watched or not.
 * @returns boolean
 */
export const useChannelWatch = () => {
  const CHANNEL_TYPE = 'videocall';
  const call = useCall();
  const [channelWatched, setChannelWatched] = useState(false);
  const { client } = useChatContext();
  const cid = `${CHANNEL_TYPE}:${call?.id}`;

  useEffect(() => {
    const channel = client.channel(CHANNEL_TYPE, call?.id);
    channel.watch();

    return () => {
      channel.stopWatching();
    };
  }, [call?.id, client]);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (event?.cid === cid) {
        setChannelWatched(true);
      }
    };

    client.on('user.watching.start', handleEvent);

    return () => {
      client.off('user.watching.start', handleEvent);
    };
  }, [client, cid]);

  return channelWatched;
};
