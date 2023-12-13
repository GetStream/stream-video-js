import { type GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Icon, useI18n } from '@stream-io/video-react-sdk';
import names from 'starwars-names';
import { useIsDemoEnvironment } from '../../context/AppEnvironmentContext';
import { useSearchParams } from 'next/navigation';

import { authOptions } from '../api/auth/[...nextauth]';

type ProntoProvider = {
  id: string;
  name: string;
  type: string;
};
type ProntoProviders = Record<string, ProntoProvider>;

export default function SignIn({
  providers,
  randomName,
}: {
  providers: ProntoProviders;
  randomName: string;
}) {
  const { t } = useI18n();
  const params = useSearchParams();
  const callbackUrl =
    params.get('callbackUrl') || process.env.NEXT_PUBLIC_BASE_PATH || '/';

  const isDemoEnvironment = useIsDemoEnvironment();
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
                  randomName={randomName}
                  callbackUrl={callbackUrl}
                />
              );
            }
            return (
              <li key={provider.id} className="rd__auth-item">
                <button
                  className="rd__button rd__auth-provider"
                  onClick={() => signIn(provider.id, { callbackUrl })}
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

const GuestLoginItem = (props: {
  provider: ProntoProvider;
  randomName: string;
  callbackUrl: string;
}) => {
  const { provider, randomName, callbackUrl } = props;
  const [name, setName] = useState(randomName);
  const logIn = () => signIn(provider.id, { name, callbackUrl });
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
          onKeyUp={(e) => e.key === 'Enter' && logIn()}
        />
      </div>
      <button
        className="rd__button rd__button--primary rd__auth-provider"
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
    // redirect to "base path" if already signed in
    return {
      redirect: {
        destination: '/',
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
      randomName: names.random(),
    },
  };
}
