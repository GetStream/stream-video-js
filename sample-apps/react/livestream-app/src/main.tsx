import '@stream-io/video-react-sdk/dist/css/styles.css';
import './main.scss';

import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { createTheme, ThemeProvider } from '@mui/material';
import { SetupLivestream } from './hosts/SetupLivestream';
import { Home } from './Home';
import { Hosts } from './hosts/Hosts';
import { Backstage } from './hosts/Backstage';
import { Viewers } from './viewers/Viewers';
import { HLSLivestreamUI } from './viewers/HLSLivestream';
import { WebRTCLivestream } from './viewers/WebRTCLivestream';
import React from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/hosts',
    element: <Hosts />,
    children: [
      {
        index: true,
        element: <SetupLivestream />,
      },
      {
        path: 'backstage/:callId',
        element: <Backstage />,
      },
    ],
  },
  {
    path: '/viewers',
    element: <Viewers />,
    children: [
      {
        path: 'hls/:callId',
        element: <HLSLivestreamUI />,
      },
      {
        path: 'webrtc/:callId',
        element: <WebRTCLivestream />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StreamTheme as="main" className="livestream-app">
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </StreamTheme>
  </React.StrictMode>,
);
