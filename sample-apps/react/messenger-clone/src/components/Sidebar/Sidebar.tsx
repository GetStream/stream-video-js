import type { ChannelPaginator } from 'stream-chat';
import { ChannelNavigation, WithComponents } from 'stream-chat-react';
import { LogoutButton } from './LogoutButton';
import { CustomChannelSearch } from '../CustomChannelSearch';
import { ChannelPreview } from '../ChannelPreview';
import { useOpenFirstChannel } from '../../hooks';

export const Sidebar = ({ paginator }: { paginator: ChannelPaginator }) => {
  useOpenFirstChannel(paginator);

  return (
    <div id="sidebar" className="str-chat">
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
