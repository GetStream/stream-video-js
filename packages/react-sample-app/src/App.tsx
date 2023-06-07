import {
  Alert,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  JoinCallData,
  StreamCall,
  StreamTheme,
  StreamVideo,
  useCreateStreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import { MeetingUI } from './components/MeetingUI';
import { NavigationBar } from './components/NavigationBar';
import { ParticipantControls } from './components/ParticipantControls';

import '@stream-io/video-styling/dist/css/styles.css';

// use different browser tabs
export type Participants = { [name: string]: string };
const participants: Participants = {
  marcelo: process.env.REACT_APP_STREAM_TOKEN_MARCELO!,
  anatoly: process.env.REACT_APP_STREAM_TOKEN_ANATOLY!,
  tommaso: process.env.REACT_APP_STREAM_TOKEN_TOMMASO!,
  sam: process.env.REACT_APP_STREAM_TOKEN_SAM!,
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
  const [callInput, setCallInput] = useState<JoinCallData | undefined>(
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
    apiKey: process.env.REACT_APP_STREAM_API_KEY!, // see <video>/data/fixtures/apps.yaml for API key/secret
    tokenOrProvider: participants[currentUser],
    user,
  });

  const createCall = async (id: string, invitees: string[]) => {
    setCallId(id);
    setCallType('default');
    setCallInput({
      data: {
        members: invitees.map((userId) => ({
          user_id: userId,
        })),
      },
      create: true,
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
        <StreamTheme>
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
                      data={callInput}
                      autoJoin
                    >
                      <MeetingUI />
                    </StreamCall>
                  )}
                </Box>
              </Box>
            </ThemeProvider>
          </StreamVideo>
        </StreamTheme>
      )}
    </div>
  );
};

export default App;
