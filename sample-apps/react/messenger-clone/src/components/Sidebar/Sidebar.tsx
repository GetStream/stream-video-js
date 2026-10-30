import { useEffect, useMemo, useRef } from 'react';
import { ChannelPaginator, type SortParamRequest } from 'stream-chat';
import {
  ChannelNavigation,
  useChatContext,
  useWorkspaceNavigation,
  WithComponents,
} from 'stream-chat-react';

import { LogoutButton } from './LogoutButton';
import { CustomChannelSearch } from '../CustomChannelSearch';
import { ChannelPreview } from '../ChannelPreview';

const sort: SortParamRequest[] = [
  { field: 'last_message_at', direction: -1 },
  { field: 'updated_at', direction: -1 },
];

/**
 * Opens the first channel of the list once per load, unless a channel is
 * already open. A load that lands in the threads view waits for the next one,
 * so it doesn't switch the user back to the channels view.
 */
const useOpenFirstChannel = (paginator: ChannelPaginator) => {
  const { isThreadsView, openChannel, openChannels } = useWorkspaceNavigation();
  // read when a page loads: the navigation changes with every open and close,
  // and resubscribing on it would replay a page that already loaded
  const navigation = useRef({
    hasOpenChannel: openChannels.length > 0,
    isThreadsView,
    openChannel,
  });
  useEffect(() => {
    navigation.current = {
      hasOpenChannel: openChannels.length > 0,
      isThreadsView,
      openChannel,
    };
  });

  useEffect(() => {
    // `items === undefined` means the list was never queried (or was reset on
    // disconnect), so the next load counts again
    let awaitingLoad = true;
    return paginator.state.subscribeWithSelector(
      ({ items }) => ({ first: items?.[0], isUnloaded: items === undefined }),
      ({ first, isUnloaded }) => {
        if (isUnloaded) {
          awaitingLoad = true;
          return;
        }
        if (!awaitingLoad || navigation.current.isThreadsView) return;
        awaitingLoad = false;
        if (first && !navigation.current.hasOpenChannel) {
          navigation.current.openChannel(first);
        }
      },
    );
  }, [paginator]);
};

/**
 * Owns the channel list paginator. Rendered as a `ChatView` child so it
 * outlives view switches: the sidebar unmounts with the channels view, and
 * owning the paginator there would re-create and re-query it every time.
 */
export const ChannelListController = () => {
  const { client } = useChatContext();
  const userId = client.userId;

  const paginator = useMemo(
    () =>
      new ChannelPaginator({
        client,
        id: 'channels:default',
        filters: {
          members: { $in: userId ? [userId] : [] },
          type: 'messaging',
        },
        sort,
        paginatorOptions: { pageSize: 10 },
        requestOptions: { presence: true },
      }),
    [client, userId],
  );

  useEffect(() => {
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client, paginator]);

  useOpenFirstChannel(paginator);

  return null;
};

export const Sidebar = () => (
  <div id="sidebar">
    <WithComponents
      overrides={{
        Search: CustomChannelSearch,
        ChannelListItemUI: ChannelPreview,
      }}
    >
      <ChannelNavigation />
    </WithComponents>
    <div id="sidebar-footer">
      <LogoutButton />
    </div>
  </div>
);
