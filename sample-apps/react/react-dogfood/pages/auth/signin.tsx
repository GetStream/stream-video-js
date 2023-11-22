import { getProviders, signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
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

  return (
    <div className="rd__auth">
      <img className="rd__auth-image" src="/auth.png" alt="Sign in" />
      <h1 className="rd__auth-heading">
        {t('Stream')}
        <span>{t('[Video Calling]')}</span>
        {t('Demo')}
      </h1>
      <ul className="rd__auth-list">
        {Object.values(providers!).map((provider) => (
          <li key={provider.id} className="rd__auth-item">
            <button
              className="rd__auth-provider"
              onClick={() => signIn(provider.id)}
            >
              <Icon
                className="rd__auth-provider__icon"
                icon="provider-google"
              />
              <span>{t('Continue with Google')}</span>
            </button>
          </li>
        ))}
        <li className="rd__auth-item">
          <div className="rd__auth-link" onClick={() => {}}>
            <Icon className="rd__auth-link__icon" icon="person-off" />
            <span>{t('Join as guest')}</span>
          </div>
        </li>
      </ul>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
