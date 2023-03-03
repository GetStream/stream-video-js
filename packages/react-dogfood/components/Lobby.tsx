import { useEffect, useMemo } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  ToggleAudioOutputButton,
  ToggleAudioPreviewButton,
  ToggleCameraPreviewButton,
  useMediaDevices,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import { LobbyHeader } from './LobbyHeader';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DisabledVideoPreview } from './DisabledVideoPreview';

const subtitles = [
  'Because we love seeing each other.',
  'You look amazing today!',
  'Everyone appreciates your work!',
  'Thank you for being with us!',
  'Your new haircut suits you well!',
  'Did you tidy up your background?',
];

type LobbyProps = {
  onJoin: () => void;
};
export const Lobby = ({ onJoin }: LobbyProps) => {
  const { data: session, status } = useSession();
  const { initialVideoState, isAudioOutputChangeSupported } = useMediaDevices();

  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    }
  }, [status]);

  const subtitle = useMemo(
    () => subtitles[Math.round(Math.random() * (subtitles.length - 1))],
    [],
  );

  if (!session) {
    return null;
  }

  return (
    <Stack height={1}>
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

            <Typography
              textAlign="center"
              color={
                initialVideoState.type === 'playing'
                  ? 'currentcolor'
                  : 'transparent'
              }
              variant="subtitle1"
            >
              {subtitle}
            </Typography>

            <VideoPreview DisabledVideoPreview={DisabledVideoPreview} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem',
              }}
            >
              <ToggleAudioPreviewButton />
              <ToggleCameraPreviewButton />
              {isAudioOutputChangeSupported && <ToggleAudioOutputButton />}
            </div>
          </Box>
          <Button
            style={{ width: '200px' }}
            data-testid="join-call-button"
            variant="contained"
            onClick={onJoin}
          >
            Join
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};
