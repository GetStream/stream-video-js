import { useEffect, useRef } from 'react';
import type { ChannelPaginator } from 'stream-chat';
import { useWorkspaceNavigation } from 'stream-chat-react';

/**
 * Opens the list's first channel when a page loads and nothing is open yet,
 * matching the channel list's v14 `setActiveChannelOnMount` default.
 */
export const useOpenFirstChannel = (paginator: ChannelPaginator) => {
  const { openChannel, openChannels } = useWorkspaceNavigation();
  const navigation = useRef({
    hasOpenChannel: openChannels.length > 0,
    openChannel,
  });
  useEffect(() => {
    navigation.current = {
      hasOpenChannel: openChannels.length > 0,
      openChannel,
    };
  });

  useEffect(() => {
    let awaitingLoad = true;
    return paginator.state.subscribeWithSelector(
      ({ items }) => ({ first: items?.[0], isUnloaded: items === undefined }),
      ({ first, isUnloaded }) => {
        if (isUnloaded) {
          awaitingLoad = true;
          return;
        }
        if (!awaitingLoad) return;
        awaitingLoad = false;
        if (first && !navigation.current.hasOpenChannel) {
          navigation.current.openChannel(first);
        }
      },
    );
  }, [paginator]);
};
