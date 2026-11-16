import { Icon, LoadingIndicator } from '@stream-io/video-react-sdk';
import { type GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import {
  useIsDemoEnvironment,
  useIsRestrictedEnvironment,
} from '../../context/AppEnvironmentContext';
import { getSavedDisplayName } from '../../hooks/useSavedDisplayName';

import { authOptions, signsInAutomatically } from '../api/auth/[...nextauth]';
import clsx from 'clsx';
import { useAppI18n } from '../../hooks/useAppI18n';

type ProntoProvider = {
  id: string;
  name: string;
  type: string;
};
type ProntoProviders = Record<string, ProntoProvider>;

export default function SignIn({
  providers,
  autoSignInAllowed,
}: {
  providers: ProntoProviders;
  autoSignInAllowed: boolean;
}) {
  const { t } = useAppI18n();
  const params = useSearchParams();
  const callbackUrl =
    params.get('callbackUrl') || process.env.NEXT_PUBLIC_BASE_PATH || '/';
  const signInAutomatically =
    autoSignInAllowed && Boolean(params.get('signIn'));
  const isDemoEnvironment = useIsDemoEnvironment();
  const isRestricted = useIsRestrictedEnvironment();

  useEffect(() => {
    if (signInAutomatically) {
      signInAsGuest(callbackUrl).catch((err) => {
        console.error('Error logging in:', err);
      });
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
          {t('common.brand.stream.text', 'Stream')}
          <span>{t('common.brand.videoCalling.text', '[Video Calling]')}</span>
          {isDemoEnvironment && t('common.brand.demo.text', 'Demo')}
        </h1>
        <ul className="rd__auth-list">
          {Object.values(providers || {}).map((provider) => {
            if (provider.id === 'stream-demo-login') {
              return (
                <GuestLoginItem key={provider.id} callbackUrl={callbackUrl} />
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
                  className="rd__button"
                  onClick={() => signIn(provider.id, { callbackUrl })}
                  data-testid="sign-in-button"
                >
                  <Icon className="rd__button__icon" icon="provider-google" />
                  <span>
                    {t(
                      'auth.signIn.withProvider.label',
                      'Sign in with {{ provider }}',
                      { provider: provider.name },
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Signs in with the demo account, keeping the name picked last time in this
 * browser.
 */
const signInAsGuest = (callbackUrl: string) => {
  const name = getSavedDisplayName();
  return signIn('stream-demo-login', {
    callbackUrl,
    ...(name ? { name } : {}),
  });
};

const GuestLoginItem = (props: { callbackUrl: string }) => {
  const { callbackUrl } = props;
  const logIn = useCallback(() => signInAsGuest(callbackUrl), [callbackUrl]);
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
    <li className="rd__auth-item">
      <button
        className="rd__button rd__button--primary rd__button--large"
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
      autoSignInAllowed: signsInAutomatically,
    },
  };
}
