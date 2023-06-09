import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from 'react-router-dom';
import { BehaviorSubject } from 'rxjs';

import { Root } from './Root';
import { UserList } from './components/UserList';
import { CallUI } from './components/Call';
import { ChatVideoWrapper } from './components/ChatVideoWrapper';
import { CallLobby } from './components/CallLobby';

import { SESSION_STORAGE_KEY } from './utils';

import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-styling/dist/css/styles.css';
import './index.css';

import users from '../data/users.json';

export type User = (typeof users)[number] & { token?: string };

// TODO: move to "store"
export const selectedUserSubject = new BehaviorSubject<User | null>(
  users.find(
    (u) => u.id === sessionStorage.getItem(SESSION_STORAGE_KEY) ?? null,
  ) as User | null,
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    loader: ({ request }) => {
      const user = selectedUserSubject.getValue();

      if (
        request.url.includes('user-selection') ||
        request.url.includes('call')
      )
        return null;

      if (!user) return redirect('/user-selection');
      return redirect('/call/lobby');
    },
    children: [
      {
        path: 'call',
        element: <ChatVideoWrapper />,
        loader: ({ params: { callId } }) => {
          const user = selectedUserSubject.getValue();

          // TODO: add who the invitation came from to filter it out of the list (?next=/call-lobby/<id>&createdBy=mark)

          if (!user)
            return redirect(
              `/user-selection${
                !callId
                  ? ''
                  : '?next=' + encodeURIComponent('/call/lobby/' + callId)
              }`,
            );

          return user;
        },
        children: [
          {
            path: 'room/:callId?',
            element: <CallUI />,
            loader: ({ params: { callId } }) => {
              if (!callId) return redirect('/call/lobby');
              return null;
            },
          },
          {
            path: 'lobby/:callId?',
            element: <CallLobby />,
          },
        ],
      },
      {
        path: 'user-selection',
        element: <UserList />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <RouterProvider router={router} />,
);
