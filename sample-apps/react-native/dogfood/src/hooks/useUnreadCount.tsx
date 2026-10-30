import { useCallback, useEffect, useMemo } from 'react';
import { useChatContext, useStateStore } from 'stream-chat-react-native';
import type { ChannelStateData } from 'stream-chat';
import { useCall } from '@stream-io/video-react-native-sdk';

const CHANNEL_TYPE = 'videocall';

/**
 * This hook is responsible for returning the unread count of the call's channel.
 * It watches the channel and reads the count the chat client keeps in its state.
 * @returns number
 */
export const useUnreadCount = () => {
  const { client } = useChatContext();
  const call = useCall();
  const callId = call?.id;
  const userId = client.userId;

  const channel = useMemo(
    () => (callId ? client.channel(CHANNEL_TYPE, callId) : undefined),
    [client, callId],
  );

  // Effect to watch the channel
  useEffect(() => {
    if (!channel) {
      return;
    }

    // active for the whole call, so connection recovery re-watches it while
    // the chat screen (whose Channel would activate it) is closed
    const release = channel.activate();
    channel.watch().catch((err) => {
      console.warn('Failed to watch the call channel', err);
    });

    return () => {
      release();
      channel.stopWatching().catch((err) => {
        console.warn('Failed to stop watching the call channel', err);
      });
    };
  }, [channel]);

  const unreadCountSelector = useCallback(
    (state: ChannelStateData) => ({
      unreadCount: userId ? (state.read[userId]?.unread_messages ?? 0) : 0,
    }),
    [userId],
  );
  const unreadState = useStateStore(channel?.state, unreadCountSelector);

  return unreadState?.unreadCount ?? 0;
};
