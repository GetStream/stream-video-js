import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from 'react-router-dom';
import { BehaviorSubject } from 'rxjs';

import { Root } from './Root';
import { UserList } from './components/UserList';
import { CallLobby } from './components/CallLobby';

import { SESSION_STORAGE_KEY } from './utils';

import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-styling/dist/css/styles.css';
import './index.css';

import users from '../data/users.json';

export type User = typeof users[number];

// TODO: move to "store"
export const selectedUserSubject = new BehaviorSubject<User | null>(
  users.find((u) => u.id === sessionStorage.getItem(SESSION_STORAGE_KEY)) ??
    null,
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <div>404</div>, // TODO: make 404 nicer
    loader: ({ request }) => {
      const user = selectedUserSubject.getValue();
      console.log(user);

      if (
        request.url.includes('user-selection') ||
        request.url.includes('call-lobby')
      )
        return null;

      if (!user) return redirect('/user-selection');
      return redirect('/call-lobby');
    },
    children: [
      {
        path: 'call-lobby/:callId?',
        element: <CallLobby />,
        loader: ({ params: { callId } }) => {
          const user = selectedUserSubject.getValue();

          // TODO: add who the invitation came from to filter it out of the list (?next=/call-lobby/<id>&createdBy=mark)

          if (!user)
            return redirect(
              `/user-selection${
                !callId
                  ? ''
                  : '?next=' + encodeURIComponent('/call-lobby/' + callId)
              }`,
            );
          return null;
        },
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
