import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { JoinedCallProvider, VideoClientProvider } from '../contexts';
import { CreateRoom } from './CreateRoom/CreateRoom';

export const AppShell = () => (
  <VideoClientProvider>
    <JoinedCallProvider>
      <div className="app-container">
        <Sidebar />
        <div className="main-panel">
          <Outlet />
        </div>
        <CreateRoom />
      </div>
    </JoinedCallProvider>
  </VideoClientProvider>
);
