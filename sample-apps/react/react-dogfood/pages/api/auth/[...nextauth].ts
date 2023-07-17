import NextAuth, { CallbacksOptions, Profile } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from 'next-auth';

type Options = CallbacksOptions<Profile & { email_verified: boolean }>;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // @ts-ignore
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        return (profile?.email_verified &&
          profile?.email?.endsWith('@getstream.io')) as boolean;
      }
      return false;
    },
  } as Partial<Options>,
  pages: {
    signIn: '/auth/signin',
  },
};

export default NextAuth(authOptions);
