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
import {
  CallsProvider,
  LayoutControllerProvider,
  useCalls,
  useLayoutController,
  useUserContext,
} from '../contexts';
import CreateRoomForm from './CreateRoomForm';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const AppShell = () => (
  <AppProviders>
    <AppLayout />
  </AppProviders>
);

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
    <LayoutControllerProvider>
      <StreamVideo client={videoClient}>
        <CallsProvider>{children}</CallsProvider>
      </StreamVideo>
    </LayoutControllerProvider>
  );
};

const AppLayout = () => {
  const { loadingCalls, loadingError } = useCalls();
  const { showCreateRoomModal, toggleShowCreateRoomModal } =
    useLayoutController();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-panel">
        {loadingError && <ErrorPanel error={loadingError} />}
        {loadingCalls && <LoadingPanel />}
        {!(loadingError && loadingCalls) && <Outlet />}
      </div>
      {/* todo: close modal on click outside */}
      {showCreateRoomModal && (
        <CreateRoomForm close={toggleShowCreateRoomModal} />
      )}
    </div>
  );
};
