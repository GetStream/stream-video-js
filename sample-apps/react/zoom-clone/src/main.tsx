import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  Navigate,
  redirect,
  RouterProvider,
} from 'react-router-dom';

import { Root } from './Root';
import { UserList } from './components/UserList';
import { CallUI } from './components/Call';
import { ChatVideoWrapper } from './components/ChatVideoWrapper';
import { CallLobby } from './components/CallLobby';

import { getSelectedUser } from './utils';

import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './index.css';

import { UserContextProvider } from './contexts/UserContext';
import React from 'react';

const router = createBrowserRouter([
  {
    path: '*',
    element: <Root />,
    loader: ({ request }) => {
      const user = getSelectedUser();

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
          const user = getSelectedUser();

          // TODO: add who the invitation came from to filter it out of the list (?next=/call-lobby/<id>&createdBy=mark)

          if (!user)
            return redirect(
              `/user-selection${
                !callId
                  ? ''
                  : '?next=' + encodeURIComponent('/call/lobby/' + callId)
              }`,
            );

          return null;
        },
        children: [
          {
            path: 'room/:callId',
            element: <CallUI />,
            loader: ({ params: { callId } }) => {
              if (!callId) return redirect('/user-selection');
              return null;
            },
          },
          {
            path: 'lobby/:callId',
            element: <CallLobby />,
            loader: ({ params: { callId } }) => {
              if (!callId) return redirect('/user-selection');
              return null;
            },
          },
          { path: '*', element: <Navigate to="/" replace /> },
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
  <React.StrictMode>
    <UserContextProvider>
      <RouterProvider router={router} />
    </UserContextProvider>
  </React.StrictMode>,
);
