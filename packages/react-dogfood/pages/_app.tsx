/* eslint-disable jsx-a11y/anchor-is-valid */
import '@stream-io/video-styling/dist/css/styles.css';
import 'stream-chat-react/dist/css/v2/index.css';
import '../style/index.scss';
import '../style/chat.css';
import Head from 'next/head';
import { Session } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import { createTheme, CssBaseline, Stack, ThemeProvider } from '@mui/material';

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

type AppProps = {
  Component: React.ComponentType;
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

// X todo: move UserInfo

// const UserInfo = () => {
//   const { data: theSession } = useSession();
//   if (!theSession || !theSession.user) {
//     return null;
//   }
//   return (
//     <Stack
//       direction="row"
//       spacing={2}
//       divider={<Divider orientation="vertical" />}
//       sx={{ alignItems: 'center' }}
//     >
//       <Box data-testid="username">{theSession.user.email}</Box>
//       <Button
//         data-testid="sign-out-button"
//         size="small"
//         variant="text"
//         onClick={() => signOut()}
//       >
//         Sign out
//       </Button>
//     </Stack>
//   );
// };
