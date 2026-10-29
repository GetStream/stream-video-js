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
 * Opens the first channel of the list once it loads, unless a channel is
 * already open (e.g. when returning from the threads view).
 */
const useOpenFirstChannel = (paginator: ChannelPaginator) => {
  const { openChannel, openChannels } = useWorkspaceNavigation();
  const hasOpenChannel = useRef(openChannels.length > 0);
  hasOpenChannel.current = openChannels.length > 0;
  useEffect(
    () =>
      paginator.state.subscribeWithSelector(
        ({ items }) => ({ first: items?.[0] }),
        ({ first }) => {
          if (first && !hasOpenChannel.current) {
            hasOpenChannel.current = true;
            openChannel(first);
          }
        },
      ),
    [paginator, openChannel],
  );
};

export const Sidebar = () => {
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
        requestOptions: { presence: true, state: true },
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

  return (
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
};
