import React, { useCallback, useMemo, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  SelectEdgeServerResponse,
  StreamVideoClient,
} from '@stream-io/video-client';
import { Room, RoomType } from '@stream-io/video-components-react';

const useStreamVideoClient = (userId: string, userToken: string) => {
  const baseUrl = '/'; // proxied to http://localhost:26991
  return useMemo(() => {
    return new StreamVideoClient('api-key', {
      baseUrl,
      sendJson: true,
      user: {
        userId,
        token: userToken,
      },
    });
  }, [userId, userToken]);
};

// use different browser tabs
const participants = [
  [
    'Alice',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.WZkPaUZb84fLkQoEEFw078Xd1RzwR42XjvBISgM2BAk',
  ],
  [
    'Bob',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.6fqa74FESB2DMUcsIiArBDJR2ckkdSvWiSb7qRLVU6U',
  ],
  [
    'Trudy',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidHJ1ZHkifQ.yhwq7Dv7znpFiIZrAb9bOYiEXM_PHtgqoq5pgFeOL78',
  ],
];

const App = () => {
  const [currentUser, setCurrentUser] = useState(participants[0][0]);
  const [currentUserToken, setCurrentUserToken] = useState(participants[0][1]);
  const [joinCallId, setJoinCallId] = useState<string>('random-id');
  const [edge, setEdge] = useState<SelectEdgeServerResponse | undefined>();
  const client = useStreamVideoClient(currentUser, currentUserToken);
  const roomRef = useRef<RoomType>();

  const joinCall = useCallback(
    async (id: string) => {
      try {
        const joinedCall = await client.joinCall({ id, type: 'video' });
        setJoinCallId(id);
        setEdge(joinedCall);
      } catch (err) {
        console.error(`Failed to join call`, err);
      }
    },
    [client],
  );

  const initiateCall = useCallback(
    async (id: string) => {
      try {
        const createdCall = await client.createCall({
          id,
          type: 'video',
          participantIds: [],
          broadcastOptions: [],
          jsonEncodedCustomData: new Uint8Array(),
        });

        await joinCall(createdCall?.id ?? '');
      } catch (err) {
        console.error(`Failed to create a call`, err);
      }
    },
    [client, joinCall],
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main className="App-main">
        <div className="App-call-control">
          <div className="left">
            <div>
              I am:{' '}
              <select
                value={currentUserToken}
                onChange={(e) => {
                  setCurrentUser(e.target.textContent || '');
                  setCurrentUserToken(e.target.value);
                }}
              >
                {participants.map(([id, token]) => (
                  <option key={id} value={token}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="right">
            <div>
              Call ID:{' '}
              <input
                type="text"
                value={joinCallId}
                onChange={(e) => {
                  setJoinCallId(e.target.value);
                }}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  initiateCall(joinCallId);
                }}
              >
                Initiate Call
              </button>
              <button
                type="button"
                onClick={() => {
                  if (joinCallId) {
                    joinCall(joinCallId);
                  }
                }}
              >
                Join Call
              </button>
              <button
                type="button"
                onClick={() => {
                  roomRef.current
                    ?.disconnect()
                    .then(() => {
                      console.log(`Disconnected from call: ${joinCallId}`);
                      setEdge(undefined);
                    })
                    .catch(console.error);
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
        {edge && edge.edgeServer && (
          <Room
            url={`wss://${edge.edgeServer.url}`}
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
