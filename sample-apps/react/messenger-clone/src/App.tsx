import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

import { ChannelHeader } from './components/ChannelHeader';
import Video from './components/Video/Video';

import { CallController } from './context';
import { useClient } from './hooks';
import { userFromToken } from './utils/userFromToken';

import { StreamChatType } from './types/chat';

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

const apiKey = import.meta.env.VITE_STREAM_KEY as string;
const userId = params.uid ?? (import.meta.env.VITE_USER_ID as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
};
const options: ChannelOptions = { limit: 10, presence: true, state: true };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const App = () => {
  const user = userFromToken(userToken);
  const client = useClient<StreamChatType>({
    apiKey,
    userData: user,
    tokenOrProvider: userToken,
  });

  if (!client) return null;

  return (
    <CallController>
      <Chat client={client}>
        <ChannelList
          filters={filters}
          options={options}
          showChannelSearch
          sort={sort}
        />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
        <Video />
      </Chat>
    </CallController>
  );
};

export default App;
