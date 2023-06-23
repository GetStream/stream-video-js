import {
  createBrowserRouter,
  Navigate,
  Outlet,
  redirect,
  RouterProvider,
} from 'react-router-dom';

import { Login, Room, RoomList } from './pages';
import { AppShell } from './components/AppShell';
import { UserContextProvider } from './contexts';
import { getSelectedUser } from './utils/user';

const Root = () => <Outlet />;

const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '*',
    Component: Root,
    loader: ({ request }) => {
      const user = getSelectedUser();

      if (!user) return redirect('/login');
      if (!request.url.includes('/rooms')) return redirect('/rooms');
      return null;
    },
    children: [
      {
        path: 'rooms',
        Component: AppShell,
        children: [
          { index: true, Component: RoomList },
          { path: ':roomState', Component: RoomList },
          {
            path: 'join/:roomId',
            Component: Room,
            loader: ({ params: { roomId } }) => {
              if (!roomId) return redirect('/rooms');
              return null;
            },
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
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
