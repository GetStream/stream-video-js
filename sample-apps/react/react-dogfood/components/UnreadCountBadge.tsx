import { useEffect, useState } from 'react';
import type { Channel, Event } from 'stream-chat';

export const UnreadCountBadge = (props: { channel?: Channel }) => {
  const { channel } = props;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!channel) {
      setUnread(0);
      return;
    }

    const sync = () => setUnread(channel.countUnread());
    sync();

    const subs = [
      channel.on('message.new', sync),
      channel.on('message.updated', sync),
      channel.on('message.deleted', sync),
      channel.on('notification.mark_read', (e: Event) => {
        if (e?.cid === channel.cid) setUnread(0);
      }),
    ];

    return () => {
      subs.forEach((s) => s.unsubscribe());
    };
  }, [channel]);

  if (!unread) return null;

  return (
    <div className="rd-chat__chat-button__unread-count-bubble">
      {unread > 99 ? '99+' : unread}
    </div>
  );
};
