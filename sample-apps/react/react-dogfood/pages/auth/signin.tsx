import {
  ClientSafeProvider,
  getProviders,
  signIn,
  useSession,
} from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Icon, useI18n } from '@stream-io/video-react-sdk';
import names from 'starwars-names';
import { useIsDemoEnvironment } from '../../context/AppEnvironmentContext';

type Providers = ReturnType<typeof getProviders> extends Promise<infer R>
  ? R
  : never;

export default function SignIn({
  providers,
  randomName,
}: {
  providers: Providers;
  randomName: string;
}) {
  const { status } = useSession();

  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (status === 'authenticated') {
      const returnUrl = (router.query['callbackUrl'] as string) || '/';
      router.push(returnUrl);
    }
  }, [router, status]);

  const isDemoEnvironment = useIsDemoEnvironment();
  return (
    <div className="rd__auth">
      <div className="rd__auth-content">
        <img className="rd__auth-image" src="/auth.png" alt="Sign in" />
        <h1 className="rd__auth-heading">
          {t('Stream')}
          <span>{t('[Video Calling]')}</span>
          {isDemoEnvironment && t('Demo')}
        </h1>
        <ul className="rd__auth-list">
          {Object.values(providers!).map((provider) => {
            if (provider.id === 'stream-demo-login') {
              return (
                <GuestLoginItem
                  key={provider.id}
                  provider={provider}
                  randomName={randomName}
                />
              );
            }
            return (
              <li key={provider.id} className="rd__auth-item">
                <button
                  className="rd__button rd__auth-provider"
                  onClick={() => signIn(provider.id)}
                  data-testid="sign-in-button"
                >
                  <Icon
                    className="rd__button__icon rd__auth-provider__icon"
                    icon="provider-google"
                  />
                  <span>{t(`Continue with ${provider.name}`)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const GuestLoginItem = ({
  provider,
  randomName,
}: {
  provider: ClientSafeProvider;
  randomName: string;
}) => {
  const [name, setName] = useState(randomName);
  return (
    <li className="rd__auth-item rd__auth-item--guest-login">
      <div className="rd__auth-item--guest_name_wrapper">
        <span>Your name:</span>
        <input
          className="rd__input"
          type="text"
          value={name}
          maxLength={25}
          onChange={(e) => setName(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && signIn(provider.id, { name })}
        />
      </div>
      <button
        className="rd__button rd__button--primary rd__auth-provider"
        onClick={() => signIn(provider.id, { name })}
        data-testid="guest-sign-in-button"
      >
        Continue
      </button>
    </li>
  );
};

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: {
      providers,
      randomName: names.random(),
    },
  };
}
