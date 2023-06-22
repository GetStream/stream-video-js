import { Link, Outlet, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Call, StreamCall, StreamVideo } from '@stream-io/video-react-sdk';
import { Button, Input, Stack, Typography } from '@mui/material';
import { useInitVideoClient } from '../hooks/UseInitVideoClient';

export const Viewers = () => {
  const { callId } = useParams<{ callId?: string }>();
  const client = useInitVideoClient({ role: 'user' });

  const [activeCall, setActiveCall] = useState<Call>();
  useEffect(() => {
    if (!callId) return;
    const call = client.call('default', callId);
    call.get().then(() => setActiveCall(call));
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
