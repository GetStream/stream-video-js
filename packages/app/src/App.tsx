import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import logo from './logo.svg';
import './App.css';
import {
  CallCreated,
  SelectEdgeServerResponse,
  Struct,
  UserRequest,
  WebsocketEvent,
} from '@stream-io/video-client';
import {
  Room,
  RoomType,
  StreamVideo,
  useStreamVideoClient,
} from '@stream-io/video-components-react';

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
  const [errorMessage, setErrorMessage] = useState('');
  const roomRef = useRef<RoomType>();

  const user = useMemo<UserRequest>(
    () => ({
      id: currentUser,
      name: currentUser,
      role: 'role',
      custom: Struct.fromJson({
        hello: 'world',
      }),
      teams: ['team-1', 'team-2'],
      profileImageUrl: '/test.jpg',
    }),
    [currentUser],
  );

  const [client, connectionError] = useStreamVideoClient(
    '/', // proxied to http://localhost:26991
    'api-key',
    currentUserToken,
    user,
  );

  useEffect(() => {
    const onHealthCheck = (message: WebsocketEvent) => {
      console.log(`Healthcheck received`, message);
    };
    return client?.on('healthCheck', onHealthCheck);
  }, [client]);

  const joinCall = useCallback(
    async (id: string) => {
      try {
        const joinedCall = await client?.joinCall({ id, type: 'video' });
        setJoinCallId(id);
        setEdge(joinedCall);
        setErrorMessage('');
      } catch (err) {
        console.error(`Failed to join call`, err);
        setErrorMessage((err as Error).message);
      }
    },
    [client],
  );

  const initiateCall = useCallback(
    async (id: string) => {
      try {
        await client?.createCall({
          id,
          type: 'video',
          participantIds: ['Alice', 'Bob', 'Trudy'],
          broadcastOptions: [],
        });

        setErrorMessage('');
      } catch (err) {
        console.error(`Failed to create a call`, err);
        setErrorMessage((err as Error).message);
      }
    },
    [client],
  );

  useEffect(() => {
    const onCallCreated = (message: CallCreated) => {
      console.log(`Call created`, message);
      const { call } = message;
      if (call && call.id) {
        joinCall(call?.id).then(() => {
          console.log(`Join call (ws-event):`, call.id);
        });
      }
    };
    // @ts-ignore
    return client?.on('callCreated', onCallCreated);
  }, [client, joinCall]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main className="App-main">
        {!client && !connectionError && <p>Connecting...</p>}
        {!client && connectionError && (
          <div className="App-errors">
            <p className="error">Error: {connectionError.toString()}</p>
          </div>
        )}
        {client && (
          <StreamVideo client={client}>
            <div className="App-call-control">
              <div className="left">
                <div>
                  I am:{' '}
                  <select
                    value={currentUserToken}
                    onChange={(e) => {
                      const selectedToken = e.target.value;
                      const [user] = participants.find(
                        ([, token]) => token === selectedToken,
                      ) || ['Alice'];
                      setCurrentUser(user);
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
                  <button
                    type="button"
                    onClick={() => {
                      initiateCall(joinCallId);
                    }}
                  >
                    Create Call
                  </button>
                </div>
                <div>
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
            <div className="App-errors">
              {errorMessage && <p className="error">Error: {errorMessage}</p>}
            </div>
            {edge && edge.edgeServer && (
              <Room
                url={`wss://${edge.edgeServer.url}`}
                token={edge.token}
                publishStats
                onConnected={(room) => {
                  room.localParticipant
                    .enableCameraAndMicrophone()
                    .then(() => {
                      console.log('Camera and Mic enabled');
                    })
                    .catch((e: Error) => {
                      console.error(
                        'Failed to get Camera and Mic permissions',
                        e,
                      );
                    });
                  roomRef.current = room;
                }}
              />
            )}
          </StreamVideo>
        )}
      </main>
    </div>
  );
};

export default App;
