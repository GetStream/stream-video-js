import { getProviders, signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Icon, useI18n } from '@stream-io/video-react-sdk';

type Providers = ReturnType<typeof getProviders> extends Promise<infer R>
  ? R
  : never;

export default function SignIn({ providers }: { providers: Providers }) {
  const { status } = useSession();

  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (status === 'authenticated') {
      const returnUrl = (router.query['callbackUrl'] as string) || '/';
      router.push(returnUrl);
    }
  }, [router, status]);

  const handleGuest = useCallback(() => {
    // window.location = `/guest?callId=${callId}`;
  }, []);

  return (
    <div className="rd__auth">
      <div className="rd__auth-content">
        <img className="rd__auth-image" src="/auth.png" alt="Sign in" />
        <h1 className="rd__auth-heading">
          {t('Stream')}
          <span>{t('[Video Calling]')}</span>
          {t('Demo')}
        </h1>
        <ul className="rd__auth-list">
          {Object.values(providers!).map((provider) => {
            const icon =
              provider.id === 'stream-demo-login'
                ? 'person-off'
                : provider.id === 'google'
                ? 'provider-google'
                : '';
            return (
              <li key={provider.id} className="rd__auth-item">
                <button
                  className="rd__button rd__auth-provider"
                  onClick={() => signIn(provider.id)}
                >
                  <Icon
                    className="rd__button__icon rd__auth-provider__icon"
                    icon={icon}
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

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
