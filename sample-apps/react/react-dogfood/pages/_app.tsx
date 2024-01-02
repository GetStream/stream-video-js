/* eslint-disable jsx-a11y/anchor-is-valid */
import '@stream-io/video-styling/dist/css/styles.css';
import 'stream-chat-react/dist/css/v2/index.css';
import '../style/index.scss';
import { ComponentType } from 'react';
import { Session } from 'next-auth';
import Head from 'next/head';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { SessionProvider } from 'next-auth/react';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { SettingsProvider } from '../context/SettingsContext';
import { AppEnvironmentProvider } from '../context/AppEnvironmentContext';

type AppProps = {
  Component: ComponentType;
  pageProps: {
    session: Session;
  };
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider
      session={session}
      basePath={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`}
    >
      <Head>
        <title>Stream Calls</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <AppEnvironmentProvider>
        <SettingsProvider>
          <StreamTheme>
            <Component {...pageProps} />
          </StreamTheme>
        </SettingsProvider>
      </AppEnvironmentProvider>
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </SessionProvider>
  );
}
