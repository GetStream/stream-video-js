import { useState, useEffect } from 'react';
import { StreamChat, Event } from 'stream-chat';
import { CHANNEL_TYPE } from '.';

// FIXME: unread count 0 on load (even if before refresh was >0)
export const UnreadCountBadge = ({
  chatClient: client,
  channelId,
  channelWatched,
}: {
  chatClient?: StreamChat | null;
  channelId: string;
  channelWatched: boolean;
}) => {
  const [unread, setUnread] = useState(0);

  const cid = `${CHANNEL_TYPE}:${channelId}`;

  useEffect(() => {
    if (!client) return;

    const handleEvent = (event: Event) => {
      if (event?.cid === cid) setUnread(0);
    };

    client.on('notification.mark_read', handleEvent);
    return () => client.off('notification.mark_read', handleEvent);
  }, [client, cid]);

  useEffect(() => {
    if (!client || !channelWatched) return;

    const handleEvent = () => {
      const channel = client.activeChannels[cid];

      setUnread(channel?.countUnread() ?? 0);
    };

    handleEvent();

    client.on('message.new', handleEvent);
    client.on('message.updated', handleEvent);
    client.on('message.deleted', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
      client.off('message.updated', handleEvent);
      client.off('message.deleted', handleEvent);
    };
  }, [client, channelWatched, cid]);

  if (!unread) return null;

  return (
    <div className="str-chat__chat-button__unread-count-bubble">{unread}</div>
  );
};
