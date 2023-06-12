import { Outlet } from 'react-router-dom';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useUserContext } from '../contexts/UserContext';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { ErrorPanel } from './Error';
import { LoadingPanel } from './Loading';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const AppShell = () => {
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingError, setLoadingError] = useState<Error>();

  const [client] = useState(() => new StreamVideoClient(apiKey));
  const { user } = useUserContext();
  useEffect(() => {
    if (!user) return;
    const connect = client.connectUser(user, user.token).catch((err) => {
      console.log('Failed to establish connection', err);
      setLoadingError(err);
    });
    return () => {
      connect
        .then(() => client.disconnectUser())
        .catch((err) => {
          console.log('Failed to disconnect', err);
          setLoadingError(err);
        });
    };
  }, [client, user]);

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
