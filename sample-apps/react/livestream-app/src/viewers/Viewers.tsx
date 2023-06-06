import { Link, Outlet, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { characters } from '../hosts/Hosts';
import {
  Call,
  StreamCall,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { Button, Input, Stack, Typography } from '@mui/material';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const Viewers = () => {
  const { callId } = useParams<{ callId?: string }>();
  const randomCharacter = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }, []);

  const tokenProvider = useCallback(async () => {
    const endpoint = new URL(
      'https://stream-calls-dogfood.vercel.app/api/auth/create-token',
    );
    endpoint.searchParams.set('api_key', apiKey);
    endpoint.searchParams.set('user_id', randomCharacter);
    const response = await fetch(endpoint).then((res) => res.json());
    return response.token as string;
  }, [randomCharacter]);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    user: {
      id: randomCharacter,
      name: randomCharacter,
      role: 'user',
    },
  });

  const [activeCall, setActiveCall] = useState<Call>();
  useEffect(() => {
    if (!callId) return;
    client
      .queryCalls({
        watch: true,
        filter_conditions: {
          cid: { $in: [`default:${callId}`] },
        },
        sort: [{ field: 'cid', direction: 1 }],
      })
      .then(({ calls }) => {
        const [call] = calls;
        if (call) {
          setActiveCall(call);
        }
      });
  }, [client, callId]);

  return (
    <StreamVideo client={client}>
      {!callId && <SetupForm />}
      {activeCall && (
        <StreamCall call={activeCall}>
          <Outlet />
        </StreamCall>
      )}
    </StreamVideo>
  );
};

const SetupForm = () => {
  const [callId, setCallId] = useState<string>('');
  return (
    <Stack justifyContent="center" alignItems="center" flexGrow={1} spacing={3}>
      <Typography variant="h3">Join Livestream</Typography>
      <Input
        placeholder="Enter Call ID"
        value={callId}
        onChange={(e) => {
          setCallId(e.target.value);
        }}
      />
      <Stack direction="row" spacing={3}>
        <Link to={callId ? `/viewers/webrtc/${callId}` : '#'}>
          <Button variant="contained" disabled={!callId}>
            Join (WebRTC)
          </Button>
        </Link>
        <Link to={callId ? `/viewers/hls/${callId}` : '#'}>
          <Button variant="contained" disabled={!callId}>
            Join (HLS)
          </Button>
        </Link>
      </Stack>
    </Stack>
  );
};
