import { LogoutButton } from './LogoutButton';
import { CustomChannelSearch } from '../CustomChannelSearch';
import { ChannelList, WithComponents } from 'stream-chat-react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserResponse,
} from 'stream-chat';

import { ChannelPreview } from '../ChannelPreview';

type SidebarProps = {
  user?: UserResponse;
};

export const Sidebar = ({ user }: SidebarProps) => {
  if (!user) return null;

  const filters: ChannelFilters = {
    members: { $in: [user.id] },
    type: 'messaging',
  };
  const options: ChannelOptions = { limit: 10, presence: true, state: true };
  const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

  return (
    <div id="sidebar" className="str-chat">
      <WithComponents
        overrides={{
          Search: CustomChannelSearch,
          ChannelListItemUI: ChannelPreview,
        }}
      >
        <ChannelList
          filters={filters}
          options={options}
          showChannelSearch
          sort={sort}
        />
      </WithComponents>
      <div id="sidebar-footer">
        <LogoutButton />
      </div>
    </div>
  );
};
