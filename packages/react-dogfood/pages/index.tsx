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
import Link from 'next/link';
import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import { Box, Button, Stack, Typography } from '@mui/material';
import { StreamI18nProvider, useI18n } from '@stream-io/video-react-sdk';

import { LobbyHeader } from '../components/LobbyHeader';

import { meetingId } from '../lib/meetingId';
import translations from '../translations';
import { useSettings } from '../context/SettingsContext';
import { Countdown } from '../components/Countdown';

type HomeProps = {
  launchDeadlineTimestamp: number;
};

export default function Home({ launchDeadlineTimestamp }: HomeProps) {
  const { data: session, status } = useSession();
  const {
    settings: { language },
  } = useSettings();

  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    }
  }, [status]);

  if (!session) {
    return null;
  }

  return (
    <StreamI18nProvider
      translationsOverrides={translations}
      language={language}
    >
      <HomeContent launchDeadlineTimestamp={launchDeadlineTimestamp} />
    </StreamI18nProvider>
  );
}

const HomeContent = ({ launchDeadlineTimestamp }: HomeProps) => {
  const { t } = useI18n();

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
              {t('Stream Meetings')}
            </Typography>
          </Box>
          <JoinCallForm />
        </Stack>
      </Stack>
      <Countdown deadlineTimestamp={launchDeadlineTimestamp} />
    </>
  );
};

const JoinCallForm = () => {
  const { t } = useI18n();
  const router = useRouter();
  const ref = useRef<HTMLInputElement | null>(null);
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
            {t('New meeting')}
          </Button>
        </Link>
      ) : (
        <Button
          data-testid="join-call-button"
          variant="contained"
          onClick={onJoin}
        >
          {t('Join')}
        </Button>
      )}
      <input
        className="rd__input rd__input--underlined rd__join-call-input"
        data-testid="join-call-input"
        ref={ref}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        placeholder={t('Or join a call with code')}
      />
    </div>
  );
};

export const getServerSideProps = async () => {
  const launchDeadlineTimestamp = new Date(
    new Date(process.env.LAUNCH_DEADLINE || '2023-06-01T00:00:00Z').getTime() +
      12 * 3600 * 1000,
  ).getTime();

  return {
    props: {
      launchDeadlineTimestamp,
    } as HomeProps,
  };
};
