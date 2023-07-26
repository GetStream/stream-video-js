import { useEffect, useState } from 'react';
import { useChatContext } from 'stream-chat-react-native';
import { Event } from 'stream-chat';
import { useCall } from '@stream-io/video-react-native-sdk';

type UseUnreadCountProps = {
  channelWatched: boolean;
};

/**
 * This hook is responsible for returning the unread count of the channel.
 * This is done through listening to multiple events.
 * @returns number
 */
export const useUnreadCount = ({ channelWatched }: UseUnreadCountProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const CHANNEL_TYPE = 'videocall';
  const { client } = useChatContext();
  const call = useCall();

  const cid = `${CHANNEL_TYPE}:${call?.id}`;

  useEffect(() => {
    if (!client) {
      return;
    }

    const handleEvent = (event: Event) => {
      if (event?.cid === cid) {
        setUnreadCount(0);
      }
    };

    client.on('notification.mark_read', handleEvent);
    return () => client.off('notification.mark_read', handleEvent);
  }, [client, cid]);

  useEffect(() => {
    if (!client || !channelWatched) {
      return;
    }

    const handleEvent = () => {
      const channel = client.activeChannels[cid];

      setUnreadCount(channel?.countUnread() ?? 0);
    };

    handleEvent();

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [client, channelWatched, cid]);

  return unreadCount;
};
