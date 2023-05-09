import './App.scss';
import { createTheme, ThemeProvider } from '@mui/material';
import { CallSetup } from './CallSetup';
import { useEffect, useState } from 'react';
import {
  StreamMeeting,
  StreamTheme,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { SpeakerView } from './SpeakerView';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// We are going to use Vite's environment variables to store our API key and token.
// https://vitejs.dev/guide/env-and-mode.html#env-files
//
// You can use any other method to store your API key and token.
const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const token = import.meta.env.VITE_STREAM_TOKEN as string;
const userId = import.meta.env.VITE_USER_ID as string;

const App = () => {
  const [callId, setCallId] = useState<string>();
  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: token,
    user: {
      id: userId,
    },
  });

  useEffect(() => {
    if (!callId) return;
    window.location.hash = `call_id=${callId}`;
  }, [callId]);

  return (
    <StreamTheme as="main" className="main-container">
      <ThemeProvider theme={theme}>
        {!callId && <CallSetup onJoin={setCallId} />}
        {callId && (
          <StreamVideo client={client}>
            <StreamMeeting
              callId={callId}
              callType="default"
              data={{ create: true }}
              autoJoin
            >
              <SpeakerView />
            </StreamMeeting>
          </StreamVideo>
        )}
      </ThemeProvider>
    </StreamTheme>
  );
};

export default App;
