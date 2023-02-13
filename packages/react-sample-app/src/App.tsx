import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { GetOrCreateCallRequest, User } from '@stream-io/video-client';
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
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2VsbyJ9.7eaqTfDEt7X_GfIyjakvAjpXpntEk4KDAtEFkB6ZcQc',
  anatoly:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYW5hdG9seSJ9.AIOplja2psB6Wrn8T15v5KeaYD-ZpPVxb1hW8bkfWcQ',
  tommaso:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidG9tbWFzbyJ9.7siVclPhJmDVZ5SUbRXdNbgYWnO_AvtHbiKRPzvhObA',
  sam: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FtIn0.epub2VrgPG3Wm8HIhtQuXozTuQ3Rr8RBQk4O9oTRhoI',
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
  const [callInput, setCallInput] = useState<
    GetOrCreateCallRequest | undefined
  >(undefined);
  const [errorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previousUser = params.get('user');
    if (previousUser !== currentUser) {
      params.set('user', currentUser);
      window.location.search = params.toString();
    }
  }, [currentUser]);

  const user = useMemo<User>(
    () => ({
      id: currentUser,
      name: currentUser,
      role: 'admin',
      teams: ['team-1, team-2'],
    }),
    [currentUser],
  );

  const client = useCreateStreamVideoClient({
    apiKey: 'w6yaq5388uym', // see <video>/data/fixtures/apps.yaml for API key/secret
    token: participants[currentUser],
    user,
  });

  const createCall = async (id: string, invitees: string[]) => {
    setCallId(id);
    setCallType('default');
    setCallInput({
      data: {
        members: invitees.map((userId) => ({
          user_id: userId,
          role: 'admin',
          user: {
            id: userId,
          },
        })),
      },
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
