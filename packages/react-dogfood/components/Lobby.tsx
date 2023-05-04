import { useEffect, useMemo } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  ToggleAudioOutputButton,
  ToggleAudioPreviewButton,
  ToggleCameraPreviewButton,
  useI18n,
  useMediaDevices,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import { LobbyHeader } from './LobbyHeader';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DisabledVideoPreview } from './DisabledVideoPreview';
import Link from 'next/link';
import { useRouter } from 'next/router';

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
  callId: string;
  enablePreview?: boolean;
};
export const Lobby = ({ onJoin, callId, enablePreview = true }: LobbyProps) => {
  const { data: session, status } = useSession();
  const { isAudioOutputChangeSupported } = useMediaDevices();
  const { t } = useI18n();

  const router = useRouter();
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

            <Typography textAlign="center" variant="subtitle1">
              {subtitle}
            </Typography>

            {enablePreview && (
              <VideoPreview DisabledVideoPreview={DisabledVideoPreview} />
            )}
            {enablePreview && (
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
            )}
          </Box>
          <Button
            style={{ width: '200px' }}
            data-testid="join-call-button"
            variant="contained"
            onClick={onJoin}
          >
            {t('Join')}
          </Button>
          {!router.pathname.includes('/guest') ? (
            <Link href={`/guest?callId=${callId}`}>
              <Button>Join as guest or anonymously</Button>
            </Link>
          ) : (
            <Link href={`/join/${callId}`}>
              <Button>Join with your Stream Account</Button>
            </Link>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
