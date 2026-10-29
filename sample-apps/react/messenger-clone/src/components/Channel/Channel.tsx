import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel as StreamChatChannel,
  MessageComposer,
  MessageList,
  WithComponents,
} from 'stream-chat-react';
import { CustomEventComponent } from '../CustomEventComponent';
import { ChannelHeader } from '../ChannelHeader';

export const Channel = ({ channel }: { channel: StreamChannel }) => (
  <WithComponents overrides={{ MessageSystem: CustomEventComponent }}>
    <StreamChatChannel channel={channel}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer focus />
    </StreamChatChannel>
  </WithComponents>
);
