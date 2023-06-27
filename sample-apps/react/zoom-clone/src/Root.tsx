import { StreamTheme } from '@stream-io/video-react-sdk';
import { Outlet } from 'react-router-dom';

export const Root = () => (
  <StreamTheme
    as="main"
    className="main-container h-full w-full flex flex-col bg-zinc-50"
  >
    <Outlet />
  </StreamTheme>
);
