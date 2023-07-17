import { Box, Button, Input, Stack, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { LobbyHeader } from '../../components/LobbyHeader';
import { meetingId } from '../../lib/meetingId';

export default function Guest() {
  const params = useSearchParams();
  const router = useRouter();

  const callIdFromQuery = params.get('callId');
  const nameFromQuery = params.get('name') || 'Guest';
  const [callId, setCallId] = useState(() => callIdFromQuery || meetingId());
  const [name, setName] = useState(nameFromQuery);

  useEffect(() => {
    if (callIdFromQuery) {
      setCallId(callIdFromQuery);
    }
  }, [callIdFromQuery]);

  useEffect(() => {
    setName(nameFromQuery);
  }, [nameFromQuery]);

  return (
    <>
      <LobbyHeader />
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        flexGrow={1}
      >
        <Stack spacing={2} alignItems="center" flexGrow={1}>
          <Box padding={2}>
            <Typography variant="h2" textAlign="center">
              Stream Meetings
            </Typography>
            <Typography variant="h5" textAlign="center">
              Guest Mode
            </Typography>
          </Box>
          <Stack direction="row" gap="10px">
            <Input
              classes={{
                input: `rd__input rd__input--underlined rd__join-call-input`,
              }}
              placeholder="Meeting ID"
              value={callId}
              onChange={(e) => {
                setCallId(e.target.value);
              }}
            />
            <Input
              classes={{
                input: `rd__input rd__input--underlined rd__join-call-input`,
              }}
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </Stack>
          <Stack gap="10px">
            <Button
              disabled={!callId || !name}
              data-testid="join-call-as-guest-button"
              variant="contained"
              onClick={() => {
                router.push(
                  `/guest/join/${callId}?mode=guest&guest_user_id=${name}`,
                );
              }}
            >
              Join as Guest
            </Button>
            <Button
              disabled={!callId || !name}
              data-testid="join-call-as-anon-button"
              variant="outlined"
              onClick={() => {
                router.push(`/guest/join/${callId}?mode=anon`);
              }}
            >
              Continue Anonymously
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}
