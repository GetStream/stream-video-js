import { useCallback } from 'react';
import type { Channel, ChannelStateData } from 'stream-chat';
import { useStateStore } from 'stream-chat-react';

export const UnreadCountBadge = (props: {
  channel?: Channel;
  userId?: string;
}) => {
  const { channel, userId } = props;
  const unreadSelector = useCallback(
    (state: ChannelStateData) => ({
      unread: userId ? (state.read[userId]?.unread_messages ?? 0) : 0,
    }),
    [userId],
  );
  const unread = useStateStore(channel?.state, unreadSelector)?.unread ?? 0;

  if (!unread) return null;

  return (
    <div className="rd__chat-button__unread-count-bubble">
      {unread > 99 ? '99+' : unread}
    </div>
  );
};
