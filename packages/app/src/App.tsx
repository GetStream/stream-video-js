import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Call,
  CallCreated,
  SelectEdgeServerResponse,
  Struct,
  UserRequest,
  WebsocketEvent,
} from '@stream-io/video-client';
import {
  RoomType,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-components-react';
import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { NavigationBar } from './components/NavigationBar';
import { ParticipantControls } from './components/ParticipantControls';
import { StageView } from './components/StageView';
import { Ringer } from './components/Ringer';

// use different browser tabs
export type Participants = { [name: string]: string };
const participants: Participants = {
  Alice:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.WZkPaUZb84fLkQoEEFw078Xd1RzwR42XjvBISgM2BAk',
  Bob: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.6fqa74FESB2DMUcsIiArBDJR2ckkdSvWiSb7qRLVU6U',
  Charlie:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2hhcmxpZSJ9.pEADCJqcZLvbIsYJwkyAJ6iR-UyVjEmZWjGp5xZRp04',
  Trudy:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidHJ1ZHkifQ.yhwq7Dv7znpFiIZrAb9bOYiEXM_PHtgqoq5pgFeOL78',
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#006cff',
    },
  },
});

const App = () => {
  const [currentUser, setCurrentUser] = useState('Alice');
  const [currentCall, setCurrentCall] = useState<Call | undefined>();
  const [isCurrentCallAccepted, setIsCurrentCallAccepted] = useState(false);
  const [edge, setEdge] = useState<SelectEdgeServerResponse | undefined>();
  const [room, setRoom] = useState<RoomType | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState('');

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

  const [client, connectionError] = useCreateStreamVideoClient(
    '/', // proxied to http://localhost:26991
    'api-key',
    participants[currentUser],
    user,
  );

  const joinCall = useCallback(
    async (id: string) => {
      try {
        const joinedCall = await client?.joinCall({ id, type: 'video' });
        setEdge(joinedCall);
        setErrorMessage('');
      } catch (err) {
        console.error(`Failed to join call`, err);
        setErrorMessage((err as Error).message);
      }
    },
    [client],
  );

  useEffect(() => {
    const onHealthCheck = (message: WebsocketEvent) => {
      console.log(`Healthcheck received`, message);
    };
    return client?.on('healthCheck', onHealthCheck);
  }, [client]);

  useEffect(() => {
    const onCallCreated = (message: CallCreated) => {
      console.log(`Call created`, message);
      const { call } = message;
      // initiator, immediately joins the call
      if (call?.createdByUserId === currentUser.toLowerCase()) {
        joinCall(call.id).then(() => {
          console.log(`Joining call with id:${call.id}`);
        });
      }

      setCurrentCall(call);
      setIsCurrentCallAccepted(false);
    };
    // @ts-ignore
    return client?.on('callCreated', onCallCreated);
  }, [client, currentUser, joinCall]);

  return (
    <div className="stream-video-sample-app">
      {!client && <Alert severity="info">Connecting...</Alert>}
      {connectionError && (
        <Alert severity="error">{connectionError.message}</Alert>
      )}
      {errorMessage && <Alert severity="warning">{errorMessage}</Alert>}
      {client && (
        <StreamVideo client={client}>
          <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex' }}>
              <CssBaseline />
              {currentCall &&
                !isCurrentCallAccepted &&
                currentCall.createdByUserId !== currentUser.toLowerCase() && (
                  <Ringer
                    caller={currentCall.createdByUserId}
                    onReject={() => {
                      setCurrentCall(undefined);
                      setIsCurrentCallAccepted(false);
                    }}
                    onAccept={() => {
                      setIsCurrentCallAccepted(true);
                      if (currentCall) {
                        joinCall(currentCall.id).then(() => {
                          console.log(`Joining call with id:${currentCall.id}`);
                        });
                      }
                    }}
                  />
                )}
              <NavigationBar />
              <ParticipantControls
                participants={participants}
                room={room}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                joinCall={joinCall}
              />
              <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}
              >
                <StageView
                  edge={edge}
                  onConnected={setRoom}
                  onLeave={() => {
                    setRoom(undefined);
                    setEdge(undefined);
                  }}
                />
              </Box>
            </Box>
          </ThemeProvider>
        </StreamVideo>
      )}
    </div>
  );
};

export default App;
