import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { CreateCallInput, UserInput } from '@stream-io/video-client';
import {
  StreamMeeting,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import { MeetingUI } from './components/MeetingUI';
import { NavigationBar } from './components/NavigationBar';
import { ParticipantControls } from './components/ParticipantControls';

import '@stream-io/video-styling/dist/css/styles.css';

// use different browser tabs
export type Participants = { [name: string]: string };
const participants: Participants = {
  marcelo:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2VsbyJ9.Nhth6nZUqQ6mSz05VAnGGJNRQewpQfqK9reYMYq67NM',
  anatoly:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYW5hdG9seSJ9.wR_ZBBq4izCxlBTgE9eXlNSMEgC0nLqoEIMH-95l4G8',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.p9f9Lp4znTHK73hyFI0JNlxMwUnDU1wJhxjs-UpDg4M',
  sam: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FtIn0.uX5xmuSRvVwuxjtxcVXxGYLZIVSfwc4yg8etCqrFVYU',
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
      id: currentUser,
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
    coordinatorRpcUrl:
      'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
    coordinatorWsUrl:
      'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
    apiKey: 'us83cfwuhy8n', // see <video>/data/fixtures/apps.yaml for API key/secret
    token: participants[currentUser],
    user,
  });

  const createCall = async (id: string, participants: string[]) => {
    setCallId(id);
    setCallType('default');
    setCallInput({
      members: participants.map((userId) => ({
        userId,
        role: 'admin',
        customJson: new TextEncoder().encode(JSON.stringify({})),
      })),
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
                  <StreamMeeting
                    callId={callId}
                    callType={callType}
                    input={callInput}
                    currentUser={currentUser}
                    autoJoin
                  >
                    <MeetingUI />
                  </StreamMeeting>
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
