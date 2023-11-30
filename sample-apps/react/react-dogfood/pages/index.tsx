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
import clsx from 'clsx';

import { Icon, StreamI18nProvider, useI18n } from '@stream-io/video-react-sdk';

import { meetingId } from '../lib/meetingId';
import translations from '../translations';
import { useSettings } from '../context/SettingsContext';
import { DefaultAppHeader } from '../components/DefaultAppHeader';

export default function Home() {
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
      <HomeContent />
    </StreamI18nProvider>
  );
}

const HomeContent = () => {
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
    <>
      <DefaultAppHeader />
      <div className="rd__home">
        <div className="rd__home-content">
          <img className="rd__home-image" src="/home.png" alt="Home" />
          <h1 className="rd__home-heading">
            {t('Stream')}
            <span>{t('[Video Calling]')}</span>
            {process.env.NEXT_PUBLIC_APP_ENVIRONMENT !== 'pronto' && t('Demo')}
          </h1>
          <p className="rd__home-description">
            {t(
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
              placeholder={t('Call ID')}
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
              {t('Join call')}
            </button>
          </div>
          <a
            href={`/join/${meetingId()}`}
            className="rd__home-new rd__link rd__link--faux-button rd__link--faux-button--primary"
          >
            <Icon className="rd__link__icon" icon="camera-add" />
            {t('Start a new call')}
          </a>
        </div>
      </div>
    </>
  );
};
