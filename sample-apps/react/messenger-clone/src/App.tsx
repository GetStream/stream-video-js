import {
  createBrowserRouter,
  Outlet,
  redirect,
  RouterProvider,
} from 'react-router-dom';
import { UserList } from './components/UserList';
import { UserContextProvider } from './contexts/UserContext';
import { getSelectedUser } from './utils/user';

import './styles/index.scss';
import { AppShell } from './components/AppShell';

const Root = () => <Outlet />;

const router = createBrowserRouter([
  {
    path: '*',
    Component: Root,
    loader: ({ request }) => {
      const user = getSelectedUser();

      if (!request.url.includes('/login') && !user) return redirect('/login');
      if (!request.url.includes('/chat') && user) return redirect('/chat');
      return null;
    },
    children: [
      {
        path: 'chat',
        Component: AppShell,
      },
      {
        path: 'login',
        Component: UserList,
      },
    ],
  },
]);

const App = () => {
  return (
    <UserContextProvider>
      <RouterProvider router={router} />
    </UserContextProvider>
  );
};

export default App;
