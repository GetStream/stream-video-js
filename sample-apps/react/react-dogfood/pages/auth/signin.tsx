import { Icon, LoadingIndicator, useI18n } from '@stream-io/video-react-sdk';
import { type GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import {
  useIsDemoEnvironment,
  useIsRestrictedEnvironment,
} from '../../context/AppEnvironmentContext';
import { getRandomName } from '../../lib/names';

import { authOptions } from '../api/auth/[...nextauth]';
import clsx from 'clsx';

type ProntoProvider = {
  id: string;
  name: string;
  type: string;
};
type ProntoProviders = Record<string, ProntoProvider>;

export default function SignIn({
  providers,
}: {
  providers: ProntoProviders;
  randomName: string;
}) {
  const { t } = useI18n();
  const params = useSearchParams();
  const callbackUrl =
    params.get('callbackUrl') || process.env.NEXT_PUBLIC_BASE_PATH || '/';
  const signInAutomatically = Boolean(params.get('signIn'));
  const isDemoEnvironment = useIsDemoEnvironment();
  const isRestricted = useIsRestrictedEnvironment();

  useEffect(() => {
    if (signInAutomatically) {
      signIn('stream-demo-login', { name: getRandomName(), callbackUrl }).catch(
        (err) => {
          console.error('Error logging in:', err);
        },
      );
    }
  }, [signInAutomatically, callbackUrl]);

  if (signInAutomatically) {
    return (
      <div className="str-video__call">
        <div className="str-video__call__loading-screen">
          <LoadingIndicator text="Signing you in..." />
        </div>
      </div>
    );
  }

  return (
    <div className="rd__auth">
      <div className="rd__auth-content">
        <img
          className="rd__auth-image"
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/auth.png`}
          alt="Sign in"
        />
        <h1 className="rd__auth-heading">
          {t('Stream')}
          <span>{t('[Video Calling]')}</span>
          {isDemoEnvironment && t('Demo')}
        </h1>
        <ul className="rd__auth-list">
          {Object.values(providers || {}).map((provider) => {
            if (provider.id === 'stream-demo-login') {
              return (
                <GuestLoginItem
                  key={provider.id}
                  provider={provider}
                  callbackUrl={callbackUrl}
                />
              );
            }
            return (
              <li
                key={provider.id}
                className={clsx(
                  'rd__auth-item',
                  isRestricted && 'rd__auth-item--secondary',
                )}
              >
                {isRestricted && (
                  <div className="rd__auth-item-label">
                    For Stream employees
                  </div>
                )}
                <button
                  className="rd__button rd__auth-provider"
                  onClick={() => signIn(provider.id, { callbackUrl })}
                  data-testid="sign-in-button"
                >
                  <Icon
                    className="rd__button__icon rd__auth-provider__icon"
                    icon="provider-google"
                  />
                  <span>{t(`Sign in with ${provider.name}`)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const GuestLoginItem = (props: {
  provider: ProntoProvider;
  callbackUrl: string;
}) => {
  const { provider, callbackUrl } = props;
  const logIn = useCallback(
    () => signIn(provider.id, { callbackUrl }),
    [callbackUrl, provider.id],
  );
  const params = useSearchParams();
  const fromQR = params.get('from_qr');
  useEffect(() => {
    if (fromQR) {
      // log in immediately if from QR code - no need to enter name
      // as it anyway doesn't have any effect inside the mobile app
      // https://getstream.slack.com/archives/C01CG3P80LV/p1704390875184309
      logIn().catch((err) => {
        console.error('Error logging in:', err);
      });
    }
  }, [fromQR, logIn]);
  return (
    <li className="rd__auth-item rd__auth-item--guest-login">
      <button
        className="rd__button rd__button--primary rd__button--large rd__auth-provider"
        onClick={logIn}
        data-testid="guest-sign-in-button"
      >
        Continue
      </button>
    </li>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    const { query } = context;
    const params = new URLSearchParams(query as Record<string, string>);
    // redirect to "base path" if already signed in
    return {
      redirect: {
        destination: `/?${params.toString()}`,
      },
    };
  }

  const providers = authOptions.providers.reduce<ProntoProviders>(
    (acc, { id, name, type }) => {
      acc[id] = { id, name, type };
      return acc;
    },
    {},
  );

  return {
    props: {
      providers,
      randomName: getRandomName(),
    },
  };
}
