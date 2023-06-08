import { Outlet } from 'react-router-dom';
import {
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useUserContext } from '../contexts/UserContext';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { ErrorPanel } from './Error';
import { LoadingPanel } from './Loading';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const AppShell = () => {
  const { user } = useUserContext();

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: user?.token || '',
    user: {
      id: user?.id || '',
      image: user?.imageUrl,
      name: user?.name,
    },
  });

  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingError, setLoadingError] = useState<Error | undefined>();

  useEffect(() => {
    if (!client) return;

    setLoadingCalls(true);
    client
      .queryCalls({
        filter_conditions: { audioRoomCall: true },
        sort: [],
        watch: true,
      })
      .catch((err) => {
        setLoadingError(err);
      })
      .finally(() => setLoadingCalls(false));
  }, [client]);

  return (
    <StreamVideo client={client}>
      <div className="home-container">
        <Sidebar client={client} />
        <div className="main-panel">
          {loadingError && <ErrorPanel error={loadingError} />}
          {loadingCalls && <LoadingPanel />}
          {!(loadingError && loadingCalls) && <Outlet />}
        </div>
      </div>
    </StreamVideo>
  );
};
