import { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import dotenv from 'dotenv';

const env = dotenv.config({ path: '.env.local' });

/**
 * Old calendar invites still link to the `*.vercel.app` hosts, but Google
 * sign-in only works on the custom domains (`NEXTAUTH_URL`). Pages on these
 * hosts redirect there; API routes stay, as the Slack command posts to them.
 */
const legacyHosts: Record<string, string> = {
  'stream-calls-dogfood.vercel.app': 'https://pronto.getstream.io',
  'stream-calls-dogfood-staging.vercel.app':
    'https://pronto-staging.getstream.io',
};

const nextConfig: NextConfig = {
  env: env.parsed,
  productionBrowserSourceMaps: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  reactStrictMode: true,
  reactCompiler: true,
  async redirects() {
    return Object.entries(legacyHosts).map(([host, destination]) => ({
      source: '/:path((?!api/|_next/|sentry|\\.well-known/).*)',
      has: [{ type: 'host' as const, value: host }],
      destination: `${destination}/:path`,
      permanent: false,
    }));
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none';" },
        ],
      },
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
