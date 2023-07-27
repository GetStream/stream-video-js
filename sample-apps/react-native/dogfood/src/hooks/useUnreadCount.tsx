import { useEffect, useState } from 'react';
import { useChatContext } from 'stream-chat-react-native';
import { Event, Channel as ChannelType } from 'stream-chat';
import { useCall } from '@stream-io/video-react-native-sdk';
import { StreamChatGenerics } from '../../types';

/**
 * This hook is responsible for returning the unread count of the channel.
 * This is done through listening to multiple events.
 * @returns number
 */
export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const CHANNEL_TYPE = 'videocall';
  const { client } = useChatContext();
  const call = useCall();

  const cid = `${CHANNEL_TYPE}:${call?.id}`;

  // Effect to watch the channel
  useEffect(() => {
    let channel: ChannelType<StreamChatGenerics>;
    const watchChannel = async () => {
      channel = client.channel(CHANNEL_TYPE, call?.id);
      await channel.watch();
    };

    watchChannel();

    return () => {
      channel.stopWatching();
    };
  }, [call?.id, client]);

  // Effect to set the unreadCount to 0 when the `notification.mark_read` event is received
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

  // Effect to update the unread count when the 'message.new' is received
  useEffect(() => {
    if (!client) {
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
  }, [client, cid]);

  return unreadCount;
};
