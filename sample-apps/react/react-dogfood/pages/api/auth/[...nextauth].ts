import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google';
import {
  CredentialInput,
  CredentialsConfig,
  Provider,
} from 'next-auth/providers';
import names from 'starwars-names';

type StreamDemoAccountCredentials = {
  name: CredentialInput;
};

/**
 * A custom provider that allows users to sign in with Stream Demo Account.
 */
const StreamDemoAccountProvider: CredentialsConfig<StreamDemoAccountCredentials> =
  {
    id: 'stream-demo-login',
    name: 'Stream Demo account',
    type: 'credentials',
    credentials: {
      name: {},
    },
    authorize: async (credentials) => {
      const name = credentials?.name || names.random();
      const id = name.replace(/[^_\-0-9a-zA-Z@]/g, '_');
      return {
        id,
        name,
        image: `https://getstream.io/random_svg/?name=${name}&id=${name}`,
      };
    },
  };

const environment = (process.env.NEXT_PUBLIC_APP_ENVIRONMENT as string) || null;
const isProntoEnvironment =
  environment === 'pronto' || environment === 'pronto-next';

export const authOptions: NextAuthOptions = {
  providers: [
    !isProntoEnvironment && StreamDemoAccountProvider,
    isProntoEnvironment &&
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
  ].filter(Boolean) as Provider[],
  callbacks: {
    async signIn({ account, profile }) {
      if (isProntoEnvironment && account?.provider === 'google' && profile) {
        const googleProfile = profile as GoogleProfile;
        const { email_verified, email } = googleProfile;
        // Only allow Stream employees to sign in "pronto" environment
        const isStreamEmployee = email.endsWith('@getstream.io');
        return email_verified && isStreamEmployee;
      }
      return (
        !isProntoEnvironment &&
        account?.provider === StreamDemoAccountProvider.id
      );
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);
