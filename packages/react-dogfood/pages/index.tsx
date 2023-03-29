import { signIn, useSession } from 'next-auth/react';
import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/router';

import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import { Box, Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { meetingId } from '../lib/meetingId';

import { LobbyHeader } from '../components/LobbyHeader';

export default function Home() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    }
  }, [status]);

  if (!session) {
    return null;
  }

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
        <Stack spacing={2} alignItems="center">
          <Box padding={2}>
            <Typography variant="h2" textAlign="center">
              Stream Meetings
            </Typography>
          </Box>
          <JoinCallForm />
        </Stack>
      </Stack>
    </>
  );
}

const JoinCallForm = () => {
  const ref = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [disabled, setDisabled] = useState(true);
  const onJoin = useCallback(() => {
    router.push(`join/${ref.current!.value}`);
  }, [ref, router]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) =>
      setDisabled(() => {
        return e.target.value.length < 3;
      }),
    [],
  );

  const handleKeyUp: KeyboardEventHandler = useCallback(
    (e) => {
      if (disabled) return;
      if (e.key === 'Enter') {
        onJoin();
      }
    },
    [onJoin, disabled],
  );
  return (
    <div
      style={{
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {disabled ? (
        <Link href={`/join/${meetingId()}`} legacyBehavior>
          <Button
            data-testid="create-and-join-meeting-button"
            variant="contained"
            fullWidth
          >
            <PhotoCameraFrontIcon sx={{ mr: 1 }} />
            New meeting
          </Button>
        </Link>
      ) : (
        <Button
          data-testid="join-call-button"
          variant="contained"
          onClick={onJoin}
        >
          Join
        </Button>
      )}
      <input
        className="rd__input rd__input--underlined rd__join-call-input"
        data-testid="join-call-input"
        ref={ref}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        placeholder="Or join a call with code"
      />
    </div>
  );
};
