import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google';
import { CredentialsConfig } from 'next-auth/providers';
import names from 'starwars-names';

/**
 * A custom provider that allows users to sign in with Stream Demo Account.
 */
const StreamDemoAccountProvider: CredentialsConfig = {
  id: 'stream-demo-login',
  name: 'Stream Demo account',
  type: 'credentials',
  credentials: {},
  authorize: async () => {
    const name = names.random();
    const id = name.replace(/[^_\-0-9a-zA-Z@]/g, '_');
    return {
      id,
      name,
      image: `https://getstream.io/random_svg/?name=${name}&id=${name}`,
    };
  },
};

const environment = (process.env.NEXT_PUBLIC_APP_ENVIRONMENT as string) || null;
const isDemoEnvironment = environment === 'demo';
const isProntoEnvironment = environment === 'pronto' || 'pronto-next';

export const authOptions: NextAuthOptions = {
  providers: [
    StreamDemoAccountProvider,
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile) {
        const googleProfile = profile as GoogleProfile;
        const { email_verified, email } = googleProfile;
        if (isProntoEnvironment) {
          // Only allow Stream employees to sign in "pronto" environment
          const isStreamEmployee = email.endsWith('@getstream.io');
          return email_verified && isStreamEmployee;
        }
        return googleProfile.email_verified;
      }
      return (
        isDemoEnvironment && account?.provider === StreamDemoAccountProvider.id
      );
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);
