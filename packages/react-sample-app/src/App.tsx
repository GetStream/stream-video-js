import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  CreateCallInput,
  MemberInput,
  Struct,
  UserInput,
} from '@stream-io/video-client';
import {
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import { NavigationBar } from './components/NavigationBar';
import { ParticipantControls } from './components/ParticipantControls';

import '@stream-io/video-styling/dist/css/styles.css';

// use different browser tabs
export type Participants = { [name: string]: string };
const participants: Participants = {
  marcelo:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9tYXJjZWxvIiwiaWF0IjoxNjYzNzc1MjA4LCJ1c2VyX2lkIjoibWFyY2VsbyJ9.1g7cO9RV4f89zeaRXa7ED2WyAKQ6DX3Pj1Qlbt5N8hg',
  anatoly:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci9hbmF0b2x5IiwiaWF0IjoxNjYzODUxODkyLCJ1c2VyX2lkIjoiYW5hdG9seSJ9.GG9bkn_jOrJQGiM-pUN5LN0bIgExFnUUIZVLYWaymXQ',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdHJlYW0tdmlkZW8tZ29AdjAuMS4wIiwic3ViIjoidXNlci90b21tYXNvIiwiaWF0IjoxNjYzODUxOTE2LCJ1c2VyX2lkIjoidG9tbWFzbyJ9.KfNas7CBQCDwNA9FBpEd6V2XK7ICrZJLpwXwQHo3M6M',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
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
  const [callId, setCallId] = useState<string | undefined>(undefined);
  const [callType, setCallType] = useState<string>('default');
  const [callInput, setCallInput] = useState<CreateCallInput | undefined>(
    undefined,
  );
  const [errorMessage] = useState('');

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

  const client = useCreateStreamVideoClient({
    // proxied to http://localhost:26991
    coordinatorRpcUrl: '/rpc',
    coordinatorWsUrl:
      'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
    apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API secret
    token: participants[currentUser],
    user,
  });

  const createCall = async (id: string, participants: string[]) => {
    setCallId(id);
    setCallType('default');
    setCallInput({
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
    });
  };

  const joinCall = (id: string) => {
    setCallId(id);
  };

  return (
    <div className="stream-video-sample-app">
      {!client && <Alert severity="info">Connecting...</Alert>}
      {errorMessage && <Alert severity="warning">{errorMessage}</Alert>}
      {client && (
        <StreamVideo client={client}>
          <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex' }}>
              <CssBaseline />
              <NavigationBar />
              <ParticipantControls
                participants={participants}
                currentCallId={callId}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                joinCall={joinCall}
                onCreateCall={createCall}
              />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  marginTop: '64px',
                  height: 'calc(100vh - 64px)',
                }}
              >
                {callId && (
                  <StreamCall
                    callId={callId}
                    callType={callType}
                    input={callInput}
                    currentUser={currentUser}
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
