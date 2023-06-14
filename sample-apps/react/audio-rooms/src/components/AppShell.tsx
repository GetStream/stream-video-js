import { Outlet } from 'react-router-dom';
import { ChildrenOnly } from '@stream-io/video-react-sdk';
import Sidebar from './Sidebar';
import { ErrorPanel } from './Error';
import { LoadingPanel } from './Loading';
import {
  CallsProvider,
  LayoutControllerProvider,
  useLoadedCalls,
  useLayoutController,
} from '../contexts';
import CreateRoomForm from './CreateRoomForm';
import { VideoClientProvider } from '../contexts/VideoClientProvider';

export const AppShell = () => (
  <AppProviders>
    <AppLayout />
  </AppProviders>
);

const AppProviders = ({ children }: ChildrenOnly) => (
  <LayoutControllerProvider>
    <VideoClientProvider>
      <CallsProvider>{children}</CallsProvider>
    </VideoClientProvider>
  </LayoutControllerProvider>
);

const AppLayout = () => {
  const { loadingCalls, loadingError } = useLoadedCalls();
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
