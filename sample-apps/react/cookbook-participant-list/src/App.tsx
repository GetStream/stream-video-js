import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import { CallSetup } from './CallSetup';
import { useEffect, useState } from 'react';
import {
  Call,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
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
const userId = 'video-cookbook-' + Math.random().toString(16).substring(2);
const apiKey = 'mmhfdzb5evj2';
const tokenProvider = async () => {
  const provider = new URL('https://pronto.getstream.io/api/auth/create-token');
  provider.searchParams.set('api_key', apiKey);
  provider.searchParams.set('user_id', userId);
  const { token } = await fetch(provider).then((res) => res.json());
  return token as string;
};

const client = new StreamVideoClient({
  apiKey,
  user: { id: userId },
  tokenProvider,
});

const App = () => {
  const [callId, setCallId] = useState<string>();
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    if (!callId) return;
    window.location.hash = `call_id=${callId}`;
    setCall(client.call('default', callId));
  }, [callId]);

  useEffect(() => {
    if (!call) {
      return;
    }
    call.join({ create: true });
  }, [call]);

  return (
    <StreamTheme as="main" className="main-container">
      <ThemeProvider theme={theme}>
        {!callId && <CallSetup onJoin={setCallId} />}
        {call && (
          <StreamVideo client={client}>
            {call && (
              <StreamCall call={call}>
                <SpeakerView />
              </StreamCall>
            )}
          </StreamVideo>
        )}
      </ThemeProvider>
    </StreamTheme>
  );
};

export default App;
