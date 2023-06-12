import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ChildrenOnly,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import Sidebar from './Sidebar';
import { ErrorPanel } from './Error';
import { LoadingPanel } from './Loading';
import { CallsProvider, useCalls, useUserContext } from '../contexts';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const AppShell = () => {
  const { loadingCalls, loadingError } = useCalls();
  return (
    <AppProviders>
      <div className="app-container">
        <Sidebar />
        <div className="main-panel">
          {loadingError && <ErrorPanel error={loadingError} />}
          {loadingCalls && <LoadingPanel />}
          {!(loadingError && loadingCalls) && <Outlet />}
        </div>
      </div>
    </AppProviders>
  );
};

const AppProviders = ({ children }: ChildrenOnly) => {
  const { user } = useUserContext();
  const [videoClient] = useState<StreamVideoClient>(
    () => new StreamVideoClient(apiKey),
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    videoClient
      .connectUser(
        {
          id: user.id,
          image: user.imageUrl,
          name: user.name,
        },
        user.token,
      )
      .catch((err) => {
        console.error(`Failed to establish connection`, err);
      });

    return () => {
      videoClient
        .disconnectUser()
        .catch((err) => console.error('Failed to disconnect', err));
    };
  }, [videoClient, user]);

  return (
    <StreamVideo client={videoClient}>
      <CallsProvider>{children}</CallsProvider>
    </StreamVideo>
  );
};
