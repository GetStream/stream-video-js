import { useUserContext } from '../../contexts/UserContext';
import { StreamTheme } from '@stream-io/video-react-sdk';
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
        <Sidebar user={user} />
        <Channel />
        <Video />
      </ClientProviders>
    </StreamTheme>
  );
};
