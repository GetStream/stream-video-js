/* eslint-disable jsx-a11y/anchor-is-valid */
import '@stream-io/video-styling/dist/css/styles.css';
import 'stream-chat-react/dist/css/v2/index.css';
import '../style/index.scss';
import { ComponentType } from 'react';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { SettingsProvider } from '../context/SettingsContext';

type AppProps = {
  Component: ComponentType;
  pageProps: {
    session: Session;
  };
};

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <SettingsProvider>
        <StreamTheme>
          <Component {...pageProps} />
        </StreamTheme>
      </SettingsProvider>
    </SessionProvider>
  );
}
