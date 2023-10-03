/* eslint-disable jsx-a11y/anchor-is-valid */
import '@stream-io/video-styling/dist/css/styles.css';
import 'stream-chat-react/dist/css/v2/index.css';
import '../style/index.scss';
import { ComponentType } from 'react';
import Head from 'next/head';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { StreamTheme } from '@stream-io/video-react-sdk';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { SettingsProvider } from '../context/SettingsContext';

const theme = createTheme({
  palette: {
    primary: {
      light: '#757ce8',
      main: '#0361FC',
      dark: '#002884',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'initial',
          color: '#fff',
        },
      },
    },
  },
});

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
      <Head>
        <title>Stream Calls</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/android-chrome-512x512.png"
        />
      </Head>

      <CssBaseline />
      <ThemeProvider theme={theme}>
        <SettingsProvider>
          <StreamTheme>
            <Component {...pageProps} />
          </StreamTheme>
        </SettingsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
