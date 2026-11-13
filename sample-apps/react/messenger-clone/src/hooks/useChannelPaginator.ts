import { useEffect, useMemo } from 'react';
import {
  type ChannelFilters,
  ChannelPaginator,
  type SortParamRequest,
  type StreamChat,
} from 'stream-chat';

const sort: SortParamRequest[] = [
  { field: 'last_message_at', direction: -1 },
  { field: 'updated_at', direction: -1 },
];

/**
 * Creates and registers the sidebar's channel list. Call it above `ChatView` so the
 * loaded pages survive view switches.
 */
export const useChannelPaginator = (client: StreamChat, userId: string) => {
  const paginator = useMemo(() => {
    const filters: ChannelFilters = {
      members: { $in: [userId] },
      type: 'messaging',
    };
    return new ChannelPaginator({
      client,
      filters,
      id: 'channels:messaging',
      paginatorOptions: { pageSize: 10 },
      requestOptions: { presence: true, state: true },
      sort,
    });
  }, [client, userId]);

  useEffect(() => {
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client, paginator]);

  return paginator;
};
