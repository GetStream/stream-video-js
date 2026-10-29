import { useUserContext } from '../../contexts/UserContext';
import { StreamTheme } from '@stream-io/video-react-sdk';
import {
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  ThreadList,
} from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  Slot,
  ThreadSlot,
} from 'stream-chat-react/slot-layout';
import { ClientProviders } from '../../contexts/ClientProviders';
import { Sidebar } from '../Sidebar';
import { Channel } from '../Channel';
import { Video } from '../Video';

// layouts, renderers and views feed the ChatView layout controller and must be
// referentially stable
const layouts = [
  { id: 'channels' as const, slots: ['channel', 'channel-thread'] },
  { id: 'threads' as const, slots: ['thread'] },
];

const ThreadPanel = () => (
  <>
    <ThreadHeader />
    <MessageList />
    <MessageComposer focus />
  </>
);

const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => <Channel channel={source} />,
  thread: ({ source }) => (
    <Thread thread={source}>
      <ThreadPanel />
    </Thread>
  ),
};

const views = {
  channels: (
    <>
      <Sidebar />
      <Slot slot="channel" />
      <Slot slot="channel-thread" />
    </>
  ),
  threads: (
    <>
      <ThreadList />
      <Slot slot="thread">
        <ThreadSlot slot="thread">
          <ThreadPanel />
        </ThreadSlot>
      </Slot>
    </>
  ),
};

export const AppShell = () => {
  const { user } = useUserContext();

  if (!user) return <div>Could not load the user data</div>;

  return (
    <StreamTheme as="main" className="main-container" theme="light">
      <ClientProviders user={user}>
        <ChatView layouts={layouts} slotRenderers={slotRenderers} views={views}>
          <ChatView.Selector />
          {/* inside ChatView so the call UI can read the open channel */}
          <Video />
        </ChatView>
      </ClientProviders>
    </StreamTheme>
  );
};
