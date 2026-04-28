import {
  Channel as StreamChatChannel,
  MessageComposer,
  MessageList,
  Thread,
  Window,
  WithComponents,
} from 'stream-chat-react';
import { CustomEventComponent } from '../CustomEventComponent';
import { ChannelHeader } from '../ChannelHeader';

export const Channel = () => (
  <WithComponents overrides={{ MessageSystem: CustomEventComponent }}>
    <StreamChatChannel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageComposer focus />
      </Window>
      <Thread />
    </StreamChatChannel>
  </WithComponents>
);
