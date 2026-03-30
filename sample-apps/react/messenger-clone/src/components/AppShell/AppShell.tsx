import { useUserContext } from '../../contexts/UserContext';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { ChatView, Thread, ThreadList } from 'stream-chat-react';
import { ClientProviders } from '../../contexts/ClientProviders';
import { Sidebar } from '../Sidebar';
import { Channel } from '../Channel';
import { Video } from '../Video';

export const AppShell = () => {
  const { user } = useUserContext();

  if (!user) return <div>Could not load the user data</div>;

  return (
    <StreamTheme as="main" className="main-container">
      <ClientProviders user={user}>
        <ChatView>
          <ChatView.Selector />
          <ChatView.Channels>
            <Sidebar user={user} />
            <Channel />
          </ChatView.Channels>
          <ChatView.Threads>
            <ThreadList />
            <ChatView.ThreadAdapter>
              <Thread />
            </ChatView.ThreadAdapter>
          </ChatView.Threads>
        </ChatView>
        <Video />
      </ClientProviders>
    </StreamTheme>
  );
};
