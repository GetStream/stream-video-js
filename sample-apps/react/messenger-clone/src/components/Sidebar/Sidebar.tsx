import { ReactNode } from 'react';
import { LogoutButton } from './LogoutButton';

export const Sidebar = ({ children }: { children: ReactNode }) => (
  <div id="sidebar" className="str-chat">
    {children}
    <div id="sidebar-footer">
      <LogoutButton />
    </div>
  </div>
);
