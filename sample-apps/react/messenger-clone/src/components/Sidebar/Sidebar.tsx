import { LogoutButton } from './LogoutButton';
import { CustomChannelSearch } from '../CustomChannelSearch';
import { ChannelList } from 'stream-chat-react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserResponse,
} from 'stream-chat';

import type { StreamChatType } from '../../types/chat';
import { ChannelPreview } from '../ChannelPreview';

type SidebarProps = {
  user?: UserResponse<StreamChatType>;
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
      <ChannelList
        filters={filters}
        options={options}
        showChannelSearch
        sort={sort}
        ChannelSearch={CustomChannelSearch}
        Preview={ChannelPreview}
      />
      <div id="sidebar-footer">
        <LogoutButton />
      </div>
    </div>
  );
};
