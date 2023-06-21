import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
  JoinedCallProvider,
  LayoutControllerProvider,
  useLayoutController,
  VideoClientProvider,
} from '../contexts';
import { CreateRoomModal } from './CreateRoomModal';

export const AppShell = () => (
  <LayoutControllerProvider>
    <VideoClientProvider>
      <JoinedCallProvider>
        <AppLayout />
      </JoinedCallProvider>
    </VideoClientProvider>
  </LayoutControllerProvider>
);

const AppLayout = () => {
  const { showCreateRoomModal, toggleShowCreateRoomModal } =
    useLayoutController();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-panel">
        <Outlet />
      </div>
      {/* todo: close modal on click outside */}
      {showCreateRoomModal && (
        <CreateRoomModal close={toggleShowCreateRoomModal} />
      )}
    </div>
  );
};
