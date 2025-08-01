import type { NextAuthOptions, Profile } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google';
import { CredentialsConfig, Provider } from 'next-auth/providers';
import { getUserIdFromEmail } from '../../../lib/names';
import { userId } from '../../../lib/idGenerators';

/**
 * A custom provider that allows users to sign in with Stream Demo Account.
 */
const StreamDemoAccountProvider: CredentialsConfig = {
  id: 'stream-demo-login',
  name: 'Stream Demo account',
  type: 'credentials',
  credentials: {},
  authorize: async () => {
    return { id: userId(), stream: false };
  },
};

const environment = (process.env.NEXT_PUBLIC_APP_ENVIRONMENT as string) || null;
const isProntoEnvironment =
  environment === 'pronto' || environment === 'pronto-sales';

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

      // original implementation
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.stream = isVerifiedStreamEmployee(account.provider, profile);
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

export default NextAuth(authOptions);
