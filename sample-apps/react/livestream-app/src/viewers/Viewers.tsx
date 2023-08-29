import { Link, Outlet, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  StreamCall,
  StreamVideo,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { Button, Input, Stack, Typography } from '@mui/material';
import { useInitVideoClient } from '../hooks/useInitVideoClient';
import { useSetCall } from '../hooks/useSetCall';
import { ErrorPanel, LoadingPanel } from '../LoadingState';

export const Viewers = () => {
  const { callId } = useParams<{ callId?: string }>();
  const client = useInitVideoClient({});

  if (!client) {
    return null;
  }

  return (
    <StreamVideo client={client}>
      {!callId ? <SetupForm /> : <ViewerLivestream />}
    </StreamVideo>
  );
};

const ViewerLivestream = () => {
  const client = useStreamVideoClient();
  const call = useSetCall(client);
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!call) {
      return;
    }
    call
      .get()
      .catch(setError)
      .finally(() => setLoading(false));
  }, [call]);

  if (error) return <ErrorPanel error={error} />;
  if (loading) return <LoadingPanel message="Loading the call data" />;

  return (
    <>
      {call && (
        <StreamCall call={call}>
          <Outlet />
        </StreamCall>
      )}
    </>
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
