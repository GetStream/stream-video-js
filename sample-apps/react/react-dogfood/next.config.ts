import { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import dotenv from 'dotenv';

const env = dotenv.config({ path: '.env.local' });

const nextConfig: NextConfig = {
  env: env.parsed,
  productionBrowserSourceMaps: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  reactStrictMode: true,
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'content-type', value: 'application/json' }],
      },
      {
        source: '/api/auth/create-token',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      {
        source: '/api/call/sample',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
export default withSentryConfig(nextConfig, {
  silent: true,
  authToken: process.env.PRONTO_SENTRY_AUTH_TOKEN,
  org: 'stream',
  project: 'video-pronto',
  widenClientFileUpload: true,
  tunnelRoute: '/sentry',
  sourcemaps: { disable: false },
  bundleSizeOptimizations: { excludeDebugStatements: true },
  webpack: { treeshake: { removeDebugLogging: true } },
});
