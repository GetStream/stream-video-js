import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'stream',
      project: 'video-composite-layout-app',
      authToken: process.env.EGRESS_SENTRY_AUTH_TOKEN,
      disable: process.env.MODE !== 'production',
    }),
  ],
  build: {
    sourcemap: true,
  },
  // Uncomment this if you're debugging a recording layout with a dev server
  // and a reverse proxy. For example:
  //
  // yarn run dev
  // ssh -R 80:localhost:5173 nokey@localhost.run
  //
  // Add setupProxyLogging() call to main.tsx, and you should see client logs
  // in dev server's console.
  //
  // server: {
  //   proxy: {
  //     '/log': {
  //       bypass(req) {
  //         const log = decodeURIComponent(req.url.slice('/log/'.length));
  //         console.log('[client log]', log);
  //         return '/ok.txt';
  //       },
  //     },
  //   },
  //   allowedHosts: true,
  // },
});
