import {
  ChannelPlaceholder,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
} from 'stream-chat-react';
import { ChannelSlot } from 'stream-chat-react/slot-layout';
import type { Thread as StreamThread } from 'stream-chat';
import { ChannelHeader } from '../ChannelHeader';

export const ChannelPanel = () => (
  <ChannelSlot slot="channel" fallback={<ChannelPlaceholder />}>
    <ChannelHeader />
    <MessageList />
    <MessageComposer focus />
  </ChannelSlot>
);

export const ThreadContents = () => (
  <>
    <ThreadHeader />
    <MessageList withDateSeparator={false} />
    <MessageComposer focus />
  </>
);

export const ThreadPanel = ({ thread }: { thread: StreamThread }) => (
  <Thread thread={thread}>
    <ThreadContents />
  </Thread>
);
