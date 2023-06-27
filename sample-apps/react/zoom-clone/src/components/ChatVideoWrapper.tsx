import { Outlet } from 'react-router-dom';
import { ClientProviders } from '../contexts/ClientProviders';
import { useUserContext } from '../contexts/UserContext';
import { JoinedCallProvider } from '../contexts/JoinedCallProvider';
import { Header } from './Header';

export const ChatVideoWrapper = () => {
  const { user } = useUserContext();
  if (!user) return <div>Could not load the user</div>;

  return (
    <ClientProviders user={user}>
      <JoinedCallProvider>
        <Header />
        <Outlet />
      </JoinedCallProvider>
    </ClientProviders>
  );
};
