import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  Call,
  GetCallEdgeServerResponse,
  MemberInput,
  Struct,
  UserInput,
  SfuModels,
} from '@stream-io/video-client';
import {
  RoomType,
  VideoRoom,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-components-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationBar } from './components/NavigationBar';
import { ParticipantControls } from './components/ParticipantControls';
import { Ringer } from './components/Ringer';

// use different browser tabs
export type Participants = { [name: string]: string };
const participants: Participants = {
  marcelo:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9tYXJjZWxvIiwiaWF0IjoxNjYzNzc1MjA4LCJ1c2VyX2lkIjoibWFyY2VsbyJ9.1g7cO9RV4f89zeaRXa7ED2WyAKQ6DX3Pj1Qlbt5N8hg',
  anatoly:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9hbmF0b2x5IiwiZXhwIjoxNjYzNzc0NTk1LCJpYXQiOjE2NjM2ODgxOTUsInVzZXJfaWQiOiJhbmF0b2x5In0.__yRmLSrxsEseHaUkbkq2cXNXsyd1ySqdmKUhYHKshs',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci90b21tYXNvIiwiZXhwIjoxNjYzNzc0NjIwLCJpYXQiOjE2NjM2ODgyMjAsInVzZXJfaWQiOiJ0b21tYXNvIn0.9Gr7t6KyRVU6piiHtK8Q73_hfahPpq4a_xNrAPy0Upc',
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
    return params.get('user') || 'marcelo';
  });
  const [currentCall, setCurrentCall] = useState<Call | undefined>();
  const [currentCallState, setCurrentCallState] = useState<
    SfuModels.CallState | undefined
  >();
  const [isCurrentCallAccepted, setIsCurrentCallAccepted] = useState(false);
  const [edge, setEdge] = useState<GetCallEdgeServerResponse | undefined>();
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
      customJson: new Uint8Array(),
    }),
    [currentUser],
  );

  const [client, connectionError] = useCreateStreamVideoClient(
    '/rpc', // proxied to http://localhost:26991
    'key10', // see <video>/data/fixtures/apps.yaml for API secret
    participants[currentUser],
    user,
  );

  const joinCall = useCallback(
    async (id: string, type: string = 'video') => {
      try {
        const callToJoin = await client?.joinCall({
          id,
          type,
          // FIXME: OL: this needs to come from somewhere
          datacenterId: 'milan',
        });
        if (callToJoin) {
          const { call: callEnvelope, latencyClaim } = callToJoin;
          if (!callEnvelope || !callEnvelope.call || !latencyClaim) return;
          const edge = await client?.getCallEdgeServer(
            callEnvelope.call,
            latencyClaim,
          );
          setCurrentCall(callEnvelope.call);
          // setCurrentCallState(callEnvelope.call.callState);
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

  const createCall = useCallback(
    async (id: string, participants: string[]) => {
      const createdCall = await client?.createCall({
        id,
        type: 'default',
        input: {
          members: participants.reduce<{ [key: string]: MemberInput }>(
            (acc, current) => {
              acc[current] = {
                role: 'admin',
                customJson: Struct.toBinary(Struct.fromJson({})),
              };
              return acc;
            },
            {},
          ),
        },
      });
      if (createdCall && createdCall.call) {
        console.log('Call created', createdCall);
        const { call } = createdCall;
        setCurrentCall(call);
        setIsCurrentCallAccepted(false);

        await joinCall(call.id, call.type);
      }
    },
    [client, joinCall],
  );

  // useEffect(() => {
  //   const onCallCreated = (message: CallCreated) => {
  //     console.log(`Call created`, message);
  //     const { call } = message;
  //     // initiator, immediately joins the call
  //     if (call?.createdByUserId === currentUser) {
  //       joinCall(call.id).then(() => {
  //         console.log(`Joining call with id:${call.id}`);
  //       });
  //     } else {
  //       setCurrentCall(call);
  //     }
  //     setIsCurrentCallAccepted(false);
  //   };
  //   return client?.on('callCreated', onCallCreated);
  // }, [client, currentUser, joinCall]);

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
                onCreateCall={createCall}
              />
              <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}
              >
                {edge && edge.credentials && (
                  <>
                    {currentCall && (
                      <VideoRoom
                        call={currentCall}
                        credentials={edge.credentials}
                      />
                    )}
                    <pre>{JSON.stringify(edge, null, 2)}</pre>
                  </>
                  // <StageView
                  //   client={client}
                  //   edgeToken={edge.token}
                  //   edgeUrl={edge.edgeServer.url}
                  //   currentCall={currentCall}
                  //   currentUser={currentUser}
                  //   onConnected={setRoom}
                  //   onLeave={() => {
                  //     setRoom(undefined);
                  //     setEdge(undefined);
                  //     setCurrentCall(undefined);
                  //     setCurrentCallState(undefined);
                  //   }}
                  // />
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
