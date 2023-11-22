import { Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  DeviceSelectorAudioInput,
  ToggleAudioOutputButton,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  useI18n,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import { AudioVolumeIndicator } from './AudioVolumeIndicator';
import { DisabledVideoPreview } from './DisabledVideoPreview';
import { LobbyHeader } from './LobbyHeader';
import { ParticipantsPreview } from './ParticipantsPreview';
import { CallSettingsButton } from './CallSettingsButton';

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
  callId?: string;
  enablePreview?: boolean;
};
export const Lobby = ({ onJoin, callId, enablePreview = true }: LobbyProps) => {
  const { data: session, status } = useSession();
  const { useSpeakerState, useMicrophoneState, useCameraState } =
    useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { isDeviceSelectionSupported } = useSpeakerState();
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

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SKIP_LOBBY !== 'true') return;
    const id = setTimeout(() => {
      onJoin();
    }, 500);
    return () => {
      clearTimeout(id);
    };
  }, [onJoin]);

  if (!session) {
    return null;
  }

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;
  return (
    <Stack height={1}>
      <LobbyHeader />
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        flexGrow={1}
        paddingBottom="45px"
      >
        <ParticipantsPreview />
        <Stack spacing={2} alignItems="center">
          <Box padding={2}>
            <Typography variant="h2" textAlign="center">
              Stream Meetings
            </Typography>

            <Typography textAlign="center" variant="subtitle1">
              {subtitle}
            </Typography>
            {enablePreview && (
              <VideoPreview
                DisabledVideoPreview={
                  hasBrowserMediaPermission
                    ? DisabledVideoPreview
                    : AllowBrowserPermissions
                }
              />
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
                <ToggleVideoPreviewButton />
                {isDeviceSelectionSupported && <ToggleAudioOutputButton />}
              </div>
            )}
          </Box>
          <Box display="flex" flexDirection="row" gap="8px">
            <Button
              style={{ width: '200px' }}
              data-testid="join-call-button"
              variant="contained"
              onClick={onJoin}
            >
              {t('Join')}
            </Button>
            <CallSettingsButton />
          </Box>
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

const AllowBrowserPermissions = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2} padding="0 15px">
      <Typography variant="h5">
        Allow your browser to access your camera and microphone.
      </Typography>
      <Typography variant="body2">
        Pronto needs access to your camera and microphone for the call.
      </Typography>
    </Box>
  );
};
