import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next/types';
import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Icon,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';

import { DefaultAppHeader } from '../components/DefaultAppHeader';
import {
  useAppEnvironment,
  useIsDemoEnvironment,
  useIsRestrictedEnvironment,
} from '../context/AppEnvironmentContext';
import { useSettings } from '../context/SettingsContext';
import { getClient } from '../helpers/client';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../lib/getServerSideCredentialsProps';
import { meetingId } from '../lib/idGenerators';
import { appTranslations as translations } from '../translations';
import { RingingCallNotification } from '../components/Ringing/RingingCallNotification';
import { useAppI18n } from '../hooks/useAppI18n';

export default function Home({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) {
  const {
    settings: { language },
  } = useSettings();
  const [client, setClient] = useState<StreamVideoClient>();
  const environment = useAppEnvironment();

  const router = useRouter();
  const useLocalCoordinator = router.query['use_local_coordinator'] === 'true';
  const coordinatorUrl = useLocalCoordinator
    ? 'http://localhost:3030/video'
    : (router.query['coordinator_url'] as string | undefined);

  useEffect(() => {
    const _client = getClient(
      { apiKey, user, userToken, coordinatorUrl },
      environment,
    );
    setClient(_client);
    window.client = _client;

    return () => {
      setClient(undefined);
      window.client = undefined;
    };
  }, [apiKey, coordinatorUrl, environment, user, userToken]);

  if (!client) {
    return null;
  }

  return (
    <StreamVideo
      client={client}
      translations={translations}
      language={language}
    >
      <HomeContent />
    </StreamVideo>
  );
}

const HomeContent = () => {
  const { t } = useAppI18n();
  const router = useRouter();
  const ref = useRef<HTMLInputElement | null>(null);

  const [disabled, setDisabled] = useState(true);

  const onJoin = useCallback(() => {
    router.push(`join/${ref.current!.value}`);
  }, [ref, router]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => setDisabled(() => e.target.value.length < 3),
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
  const isDemoEnvironment = useIsDemoEnvironment();
  const isRestricted = useIsRestrictedEnvironment();

  return (
    <>
      <DefaultAppHeader />
      <RingingCallNotification />
      <div className="rd__home">
        <div className="rd__home-content">
          <img
            className="rd__home-image"
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/home.png`}
            alt={t('home.logo.ariaLabel', 'Home')}
          />
          <h1 className="rd__home-heading">
            {t('common.brand.stream.text', 'Stream')}
            <span>
              {t('common.brand.videoCalling.text', '[Video Calling]')}
            </span>
            {isDemoEnvironment && t('common.brand.demo.text', 'Demo')}
          </h1>
          <p className="rd__home-description">
            {isRestricted
              ? t(
                  'home.joinCall.description',
                  'Join a call by providing its Call ID',
                )
              : t(
                  'home.startOrJoinCall.description',
                  'Start a new call or join an existing one by providing its Call ID',
                )}
          </p>
          <div className="rd__home-join">
            <input
              className="rd__input rd__home-input"
              data-testid="join-call-input"
              ref={ref}
              onChange={handleChange}
              onKeyUp={handleKeyUp}
              placeholder={t('common.callId.placeholder', 'Call ID')}
            />
            <button
              className={clsx(
                'rd__home-new rd__button rd__button__join',
                !disabled && 'rd__button--primary',
              )}
              data-testid="join-call-button"
              disabled={disabled}
              onClick={onJoin}
            >
              <Icon className="rd__button__icon" icon="login" />
              {t('home.joinCall.label', 'Join call')}
            </button>
          </div>
          {!isRestricted && (
            <>
              <Link
                href={`/join/${meetingId()}`}
                className={clsx(
                  'rd__home-new rd__link rd__link--faux-button',
                  disabled && 'rd__link--primary',
                )}
                data-testid="create-and-join-meeting-button"
              >
                <Icon className="rd__link__icon" icon="camera-add" />
                {t('home.startNewCall.label', 'Start new call')}
              </Link>
              <div className="rd__home-button-group">
                <Link
                  href={`/join/${meetingId()}?type=restricted`}
                  className="rd__home-new rd__link rd__link--faux-button"
                  data-testid="create-and-join-restricted-meeting-button"
                >
                  <Icon className="rd__link__icon" icon="camera-add" />
                  {t(
                    'home.startNewRestrictedCall.label',
                    'Start new restricted call',
                  )}
                </Link>
                <Link
                  href={`/ring`}
                  className="rd__home-ring rd__link rd__link--faux-button"
                  data-testid="goto-ring-button"
                >
                  <Icon className="rd__link__icon" icon="dialpad" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (process.env.NEXT_PUBLIC_APP_ENVIRONMENT === 'demo') {
    const { query } = ctx;
    const params = new URLSearchParams(query as Record<string, string>);
    const callId = meetingId();

    return {
      redirect: {
        destination: `/join/${callId}?${params.toString()}`,
        permanent: false,
      },
    };
  }

  return await getServerSideCredentialsProps(ctx);
};
