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

// The demo token endpoint decides which app the token is for, so the client
// is created with the `apiKey` it returns instead of a hardcoded one.
const fetchCredentials = async () => {
  const provider = new URL('https://pronto.getstream.io/api/auth/create-token');
  provider.searchParams.set('environment', 'demo');
  provider.searchParams.set('user_id', userId);
  const res = await fetch(provider).then((r) => r.json());
  return res as { apiKey: string; token: string };
};

const App = () => {
  const [client, setClient] = useState<StreamVideoClient>();
  const [callId, setCallId] = useState<string>();
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    let myClient: StreamVideoClient | undefined;
    let cancelled = false;
    fetchCredentials()
      .then(({ apiKey, token }) => {
        if (cancelled) return;
        myClient = new StreamVideoClient({
          apiKey,
          user: { id: userId },
          token,
          tokenProvider: () => fetchCredentials().then((c) => c.token),
        });
        setClient(myClient);
      })
      .catch((err) => console.error('Failed to fetch demo credentials', err));

    return () => {
      cancelled = true;
      myClient?.disconnectUser().catch((err) => console.error(err));
      setClient(undefined);
    };
  }, []);

  useEffect(() => {
    if (!client || !callId) return;
    window.location.hash = `call_id=${callId}`;
    setCall(client.call('default', callId));
  }, [client, callId]);

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
        {client && call && (
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
