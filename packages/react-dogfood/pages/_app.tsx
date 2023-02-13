/* eslint-disable jsx-a11y/anchor-is-valid */
import '@stream-io/video-styling/dist/css/styles.css';
import '../style/app.css';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CssBaseline,
  Box,
  Stack,
  Button,
  Divider,
  createTheme,
  ThemeProvider,
} from '@mui/material';
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
        <Stack height="100vh">
          <Stack direction="row" spacing={2}>
            <Box flexGrow={1} padding={1}>
              <Link href="/" data-testid="home-button">
                <a>
                  <Image
                    src="/stream-logo.png"
                    alt="Stream logo"
                    width={347 / 5}
                    height={216 / 5}
                  />
                </a>
              </Link>
            </Box>
            <UserInfo />
          </Stack>
          <Component {...pageProps} />
        </Stack>
      </ThemeProvider>
    </SessionProvider>
  );
}

const UserInfo = () => {
  const { data: theSession } = useSession();

  return (
    theSession &&
    theSession.user && (
      <Stack
        direction="row"
        spacing={2}
        divider={<Divider orientation="vertical" />}
        sx={{ alignItems: 'center' }}
      >
        <Box data-testid="username">{theSession.user.email}</Box>
        <Button
          data-testid="sign-out-button"
          size="small"
          variant="text"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </Stack>
    )
  );
};
