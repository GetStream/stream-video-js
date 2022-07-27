import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Call,
  CallCreated,
  CreateUserRequest,
  Healthcheck,
  SelectEdgeServerResponse,
  Struct,
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
  alice:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.WZkPaUZb84fLkQoEEFw078Xd1RzwR42XjvBISgM2BAk',
  bob: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.6fqa74FESB2DMUcsIiArBDJR2ckkdSvWiSb7qRLVU6U',
  charlie:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2hhcmxpZSJ9.pEADCJqcZLvbIsYJwkyAJ6iR-UyVjEmZWjGp5xZRp04',
  trudy:
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
  const [currentUser, setCurrentUser] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('user') || 'alice';
  });
  const [currentCall, setCurrentCall] = useState<Call | undefined>();
  const [isCurrentCallAccepted, setIsCurrentCallAccepted] = useState(false);
  const [edge, setEdge] = useState<SelectEdgeServerResponse | undefined>();
  const [room, setRoom] = useState<RoomType | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previousUser = params.get('user');
    if (previousUser !== currentUser) {
      params.set('user', currentUser);
      window.location.search = params.toString();
    }
  }, [currentUser]);

  const user = useMemo<CreateUserRequest>(
    () => ({
      id: currentUser,
      name: currentUser,
      role: 'user-role',
      teams: ['team-1, team-2'],
      imageUrl: '/profile.png',
      custom: Struct.fromJson({
        key: 'value',
        hello: 'world',
      }),
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
    const onHealthCheck = (message: Healthcheck) => {
      console.log(`Healthcheck received`, message);
    };
    return client?.on('healthCheck', onHealthCheck);
  }, [client]);

  useEffect(() => {
    const onCallCreated = (message: CallCreated) => {
      console.log(`Call created`, message);
      const { call } = message;
      // initiator, immediately joins the call
      if (call?.createdByUserId === currentUser) {
        joinCall(call.id).then(() => {
          console.log(`Joining call with id:${call.id}`);
        });
      }

      setCurrentCall(call);
      setIsCurrentCallAccepted(false);
    };
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
                currentCall.createdByUserId !== currentUser && (
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
                currentCall={currentCall}
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
                    setCurrentCall(undefined);
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
