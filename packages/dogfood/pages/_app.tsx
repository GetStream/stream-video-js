import '../style/app.css';
import '@stream-io/video-components-react/dist/css/styles.css';

import { SessionProvider } from 'next-auth/react';
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
