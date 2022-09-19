import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  Call,
  CallCreated,
  CallState,
  SelectEdgeServerResponse,
  UserInput,
} from '@stream-io/video-client';
import {
  RoomType,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-components-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationBar } from './components/NavigationBar';
import { ParticipantControls } from './components/ParticipantControls';
import { Ringer } from './components/Ringer';
import { StageView } from './components/StageView';

// use different browser tabs
export type Participants = { [name: string]: string };
const participants: Participants = {
  alice:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWxpY2UifQ.p0_t4y5AU8T5Ib6qEvcKG6r2wduwt0n0SW6cD867SY8',
  bob: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYm9iIn0.YZtLYNIPbxjvpzvWX4Vz3xXerTSbjcl4F3kFkC5sY3s',
  charlie:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2hhcmxpZSJ9.JWa5dEyKWCwpw6BmgWtebXoSPbgQgE3GP0l92AbDqIo',
  trudy:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidHJ1ZHkifQ.dcoph9LxfiGBkTCJjIyf7ENtGQInSsB-rt8-98Ll2UY',
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
  const [currentCallState, setCurrentCallState] = useState<
    CallState | undefined
  >();
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

  const user = useMemo<UserInput>(
    () => ({
      name: currentUser,
      role: 'admin',
      teams: ['team-1, team-2'],
      imageUrl: '/profile.png',
      customJson: new TextEncoder().encode(
        JSON.stringify({
          key: 'value',
          hello: 'world',
        }),
      ),
    }),
    [currentUser],
  );

  const [client, connectionError] = useCreateStreamVideoClient(
    '/rpc', // proxied to http://localhost:26991
    'key1',
    participants[currentUser],
    user,
  );

  const joinCall = useCallback(
    async (id: string, type: string = 'video') => {
      try {
        const callToJoin = await client?.joinCall({ id, type });
        if (callToJoin && callToJoin.call) {
          const edge = await client?.selectEdgeServer(
            callToJoin.call,
            callToJoin.edges,
          );
          setCurrentCall(callToJoin.call);
          setCurrentCallState(callToJoin.callState);
          setEdge(edge);
        }
        setErrorMessage('');
      } catch (err) {
        console.error(`Failed to join call`, err);
        setErrorMessage((err as Error).message);
      }
    },
    [client],
  );

  useEffect(() => {
    const onCallCreated = (message: CallCreated) => {
      console.log(`Call created`, message);
      const { call } = message;
      // initiator, immediately joins the call
      if (call?.createdByUserId === currentUser) {
        joinCall(call.id).then(() => {
          console.log(`Joining call with id:${call.id}`);
        });
      } else {
        setCurrentCall(call);
      }
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
                currentCallState={currentCallState}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                joinCall={joinCall}
              />
              <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}
              >
                {edge && edge.edgeServer && (
                  <StageView
                    client={client}
                    edgeToken={edge.token}
                    edgeUrl={edge.edgeServer.url}
                    currentCall={currentCall}
                    currentUser={currentUser}
                    onConnected={setRoom}
                    onLeave={() => {
                      setRoom(undefined);
                      setEdge(undefined);
                      setCurrentCall(undefined);
                      setCurrentCallState(undefined);
                    }}
                  />
                )}
              </Box>
            </Box>
          </ThemeProvider>
        </StreamVideo>
      )}
    </div>
  );
};

export default App;
