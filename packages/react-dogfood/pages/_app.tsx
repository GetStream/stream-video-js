/* eslint-disable jsx-a11y/anchor-is-valid */
import '@stream-io/video-styling/dist/css/styles.css';
import '../style/index.scss';
import { SessionProvider } from 'next-auth/react';
import { createTheme, CssBaseline, Stack, ThemeProvider } from '@mui/material';
import Head from 'next/head';

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
});
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Stream Calls</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <CssBaseline />
      <ThemeProvider theme={theme}>
        <div className="str-video">
          <Stack height="100vh">
            <Component {...pageProps} />
          </Stack>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
