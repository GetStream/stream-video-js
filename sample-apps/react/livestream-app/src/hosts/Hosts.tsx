import { StreamVideo } from '@stream-io/video-react-sdk';
import { Outlet } from 'react-router-dom';
import { useInitVideoClient } from '../hooks/useInitVideoClient';

export const Hosts = () => {
  const client = useInitVideoClient({ role: 'host' });

  if (!client) {
    return null;
  }

  return (
    <StreamVideo client={client}>
      <Outlet />
    </StreamVideo>
  );
};
