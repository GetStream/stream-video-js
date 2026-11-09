import { useUserContext } from '../../contexts/UserContext';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { ThreadList, useChatContext, WithComponents } from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  DisposedChannelRelease,
  type LayoutDescriptor,
  Slot,
  ThreadSlot,
} from 'stream-chat-react/slot-layout';
import { ClientProviders } from '../../contexts/ClientProviders';
import { Sidebar } from '../Sidebar';
import { ChannelPanel, ThreadContents, ThreadPanel } from '../Channel';
import { CustomEventComponent } from '../CustomEventComponent';
import { Video } from '../Video';
import { useChannelPaginator } from '../../hooks';
import type { User } from '../../types/user';

const layouts: LayoutDescriptor[] = [
  { id: 'channels', slots: ['channel', 'channel-thread'] },
  { id: 'threads', slots: ['thread'] },
];

const slotRenderers: ChatViewSlotRenderers = {
  thread: ({ source }) => <ThreadPanel thread={source} />,
};

export const AppShell = () => {
  const { user } = useUserContext();

  if (!user) return <div>Could not load the user data</div>;

  return (
    <StreamTheme as="main" className="main-container" theme="light">
      <ClientProviders user={user}>
        <MessengerChatView user={user} />
      </ClientProviders>
    </StreamTheme>
  );
};

const MessengerChatView = ({ user }: { user: User }) => {
  const { client } = useChatContext();
  const paginator = useChannelPaginator(client, user.id);

  return (
    <ChatView
      layouts={layouts}
      slotRenderers={slotRenderers}
      views={{
        channels: (
          <WithComponents overrides={{ MessageSystem: CustomEventComponent }}>
            <Sidebar paginator={paginator} />
            <Slot slot="channel">
              <ChannelPanel />
            </Slot>
            <Slot slot="channel-thread" />
          </WithComponents>
        ),
        threads: (
          <>
            <ThreadList />
            <Slot slot="thread">
              <ThreadSlot slot="thread">
                <ThreadContents />
              </ThreadSlot>
            </Slot>
          </>
        ),
      }}
    >
      <ChatView.Selector />
      <DisposedChannelRelease />
      <Video />
    </ChatView>
  );
};
