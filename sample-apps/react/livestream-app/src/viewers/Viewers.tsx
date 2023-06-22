import { Link, Outlet, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StreamCall, StreamVideo } from '@stream-io/video-react-sdk';
import { Button, Input, Stack, Typography } from '@mui/material';
import { useInitVideoClient } from '../hooks/UseInitVideoClient';
import { useSetCall } from '../hooks/useSetCall';

export const Viewers = () => {
  const { callId } = useParams<{ callId?: string }>();
  const client = useInitVideoClient({ role: 'user' });
  const call = useSetCall(client);

  useEffect(() => {
    if (!call) {
      return;
    }
    call.get();
  }, [call]);

  return (
    <StreamVideo client={client}>
      {!callId && <SetupForm />}
      {call && (
        <StreamCall call={call}>
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
