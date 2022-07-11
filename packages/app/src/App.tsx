import React, { useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  createClient,
  SelectEdgeServerResponse,
  withBearerToken,
} from '@stream-io/video-client';
import { Room, RoomType } from '@stream-io/video-components-react';

const useStreamVideoClient = (userToken: string) => {
  const baseUrl = '/'; // proxied to http://localhost:26991
  return React.useMemo(() => {
    return createClient({
      baseUrl,
      sendJson: true,
      interceptors: [withBearerToken(userToken)],
    });
  }, [baseUrl, userToken]);
};

// use different browser tabs
const participants = [
  [
    'alice',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.WZkPaUZb84fLkQoEEFw078Xd1RzwR42XjvBISgM2BAk',
  ],
  [
    'bob',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.6fqa74FESB2DMUcsIiArBDJR2ckkdSvWiSb7qRLVU6U',
  ],
  [
    'trudy',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidHJ1ZHkifQ.yhwq7Dv7znpFiIZrAb9bOYiEXM_PHtgqoq5pgFeOL78',
  ],
];

const request = {
  callId: 'react-test-room',
  latencyByEdge: {
    a: {
      measurements: [10, 20],
    },
  },
};

const App = () => {
  const userToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoib2xpdmVybGF6In0.vn3Ysp3yeIy41yCqNWa42H2Lj3TIcLbGWtw1djeLrss`;
  const client = useStreamVideoClient(userToken);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [edge, setEdge] = useState<SelectEdgeServerResponse | null>(null);
  const roomRef = useRef<RoomType | null>(null);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main className="App-main">
        {participants
          .map(
            ([user, token]) =>
              !connectedUser && (
                <button
                  key={user}
                  type="button"
                  disabled={user === connectedUser}
                  onClick={() => {
                    client
                      .selectEdgeServer(request, {
                        interceptors: [withBearerToken(token)],
                      })
                      .then(({ response }) => {
                        setEdge(response);
                        setConnectedUser(user);
                      })
                      .catch((e) => {
                        console.error('Failed to connect: ', e);
                        setConnectedUser(null);
                      });
                  }}
                >
                  Connect as: {user}
                </button>
              ),
          )
          .filter(Boolean)}
        {connectedUser && (
          <button
            type="button"
            onClick={() => {
              roomRef.current
                ?.disconnect()
                .then(() => {
                  setConnectedUser(null);
                  setEdge(null);
                })
                .catch(console.error);
            }}
          >
            Disconnect: {connectedUser}
          </button>
        )}
        {edge && edge.edgeServer && (
          <Room
            url={'wss://' + edge.edgeServer.url}
            token={edge.token}
            onConnected={(room) => {
              room.localParticipant
                .enableCameraAndMicrophone()
                .then(() => {
                  console.log('Camera and Mic enabled');
                })
                .catch((e) => {
                  console.error('Failed to get Camera and Mic permissions', e);
                });
              roomRef.current = room;
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
