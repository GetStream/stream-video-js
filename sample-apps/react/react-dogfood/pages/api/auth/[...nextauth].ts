import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextAuthOptions, Profile } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google';
import { getRandomName, getUserIdFromEmail } from '../../../lib/names';
import { userId } from '../../../lib/idGenerators';
import { CredentialsConfig } from 'next-auth/providers/credentials';
import { Provider } from 'next-auth/providers/index';

/**
 * A custom provider that allows users to sign in with Stream Demo Account.
 */
const StreamDemoAccountProvider: CredentialsConfig = {
  id: 'stream-demo-login',
  name: 'Stream Demo account',
  type: 'credentials',
  credentials: {
    name: { label: 'Name', type: 'text' },
  },
  authorize: async (credentials) => {
    return {
      id: userId(),
      name: toDisplayName(credentials?.name) ?? defaultGuestName(),
      stream: false,
    };
  },
};

/**
 * New guests without a saved name get a random one once, so it stays the same
 * on every page load. pronto-sales guests are customers and type their own.
 */
const defaultGuestName = () =>
  environment === 'pronto-sales' ? undefined : getRandomName();

/**
 * Trims a display name sent by the client and caps it at the lobby's input
 * length, or returns `undefined` when there is nothing to keep.
 */
const toDisplayName = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, 25).trim() || undefined;
};

const environment = (process.env.NEXT_PUBLIC_APP_ENVIRONMENT as string) || null;
const isProntoEnvironment =
  environment === 'pronto' || environment === 'pronto-sales';

/**
 * Pronto (pronto and pronto-staging) production deployments let people choose
 * between Google and the demo account instead of signing in with the demo
 * account automatically. Previews and local dev keep the automatic sign-in, as
 * Google needs a pre-registered redirect URI.
 */
export const signsInAutomatically = !(
  environment === 'pronto' && process.env.VERCEL_ENV === 'production'
);

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const authOptions: NextAuthOptions = {
  providers: [
    StreamDemoAccountProvider,
    isProntoEnvironment &&
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
  ].filter(Boolean) as Provider[],
  callbacks: {
    async signIn({ account, profile }) {
      if (isProntoEnvironment && account?.provider === 'google' && profile) {
        return isVerifiedStreamEmployee('google', profile);
      }
      return account?.provider === StreamDemoAccountProvider.id;
    },
    async redirect({ baseUrl, url }) {
      // when running the demo on Vercel, we need to patch the baseUrl
      if (process.env.VERCEL && environment === 'demo') {
        baseUrl =
          process.env.NEXT_PUBLIC_DEMO_ENVIRONMENT !== 'staging'
            ? `https://getstream.io/${basePath}`
            : `https://staging.getstream.io/${basePath}`;
      }

      return resolveRedirect(url, baseUrl);
    },
    async jwt({ token, account, profile, trigger, session }) {
      if (account && profile) {
        token.stream = isVerifiedStreamEmployee(account.provider, profile);
      }
      // demo account users pick their name in the lobby, Google users keep theirs
      if (trigger === 'update' && !token.stream) {
        const name = toDisplayName(session?.name);
        if (name) token.name = name;
      }
      return token;
    },
    async session({ token, session }) {
      if (session.user) {
        session.user.stream = token.stream;
        session.user.streamUserId = token.stream
          ? getUserIdFromEmail(token.email!)
          : token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: `${basePath}/auth/signin`,
  },
};

/**
 * The `next-auth` default: keep same-origin callbacks, send everything else
 * back to the deployment root.
 */
const resolveRedirect = (url: string, baseUrl: string) => {
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  else if (new URL(url).origin === baseUrl) return url;
  return baseUrl;
};

const firstHeaderValue = (header: string | string[] | undefined) => {
  const value = Array.isArray(header) ? header[0] : header;
  return value?.split(',')[0].trim() || undefined;
};

/**
 * Every preview deployment gets its own hostname, but `NEXTAUTH_URL` is a
 * static project setting pointing at the canonical domain. Deriving the base
 * URL from the incoming request keeps post-login callbacks on the host the
 * user is actually browsing instead of bouncing them to that canonical domain.
 * Google sign-in still needs `NEXTAUTH_URL`, as its `redirect_uri` has to match
 * a pre-registered one, so previews are limited to the demo account login.
 */
const detectPreviewBaseUrl = (req: NextApiRequest) => {
  if (process.env.VERCEL_ENV !== 'preview') return undefined;
  const host = firstHeaderValue(
    req.headers['x-forwarded-host'] ?? req.headers.host,
  );
  if (!host) return undefined;
  const protocol =
    firstHeaderValue(req.headers['x-forwarded-proto']) ?? 'https';
  return `${protocol}://${host}${basePath}`;
};

const authOptionsForRequest = (req: NextApiRequest): NextAuthOptions => {
  const previewBaseUrl = detectPreviewBaseUrl(req);
  if (!previewBaseUrl) return authOptions;
  return {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      redirect: async ({ url }) => resolveRedirect(url, previewBaseUrl),
    },
  };
};

const isVerifiedStreamEmployee = (
  provider: string,
  profile: Profile,
): boolean => {
  if (provider !== 'google' || !profile) return false;
  const googleProfile = profile as GoogleProfile;
  return (
    googleProfile.email_verified &&
    googleProfile.email.endsWith('@getstream.io')
  );
};

const handler = async (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, authOptionsForRequest(req));

export default handler;
