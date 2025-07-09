import {
  createBrowserRouter,
  Outlet,
  redirect,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { UserList } from './components/UserList';
import { UserContextProvider } from './contexts/UserContext';
import { getSelectedUser } from './utils/user';

import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './styles/index.scss';

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
