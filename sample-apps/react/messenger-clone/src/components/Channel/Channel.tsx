import {
  Channel as StreamChatChannel,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import { CustomEventComponent } from '../CustomEventComponent';
import { ChannelHeader } from '../ChannelHeader';

export const Channel = () => (
  <StreamChatChannel MessageSystem={CustomEventComponent}>
    <Window>
      <ChannelHeader />
      <MessageList />
      <MessageInput focus />
    </Window>
    <Thread />
  </StreamChatChannel>
);
