import { Outlet } from 'react-router-dom';

import { Header } from './components/Header';

export const Root = () => (
  <div className="h-full w-full flex flex-col bg-zinc-50 str-video__theme-variables">
    <Header />
    <Outlet />
  </div>
);
