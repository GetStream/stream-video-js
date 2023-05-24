import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { createToken } from '../helpers/jwt';
import type { User } from '@stream-io/video-react-sdk';

export type ServerSideCredentialsProps = {
  user: User;
  userToken: string;
  apiKey: string;
  gleapApiKey?: string;
};

export const getServerSideCredentialsProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    const url = context.req.url;
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${url}`,
      },
    };
  }

  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_SECRET_KEY as string;
  const gleapApiKey = (process.env.GLEAP_API_KEY as string) || null;

  const userIdOverride = context.query['user_id'] as string | undefined;
  const userId = (
    userIdOverride ||
    session.user?.email ||
    'unknown-user'
  ).replaceAll(' ', '_'); // Otherwise, SDP parse errors with MSID

  // Chat does not allow for Id's to include special characters
  const streamUserId = userId
    .replace(/[^_\-0-9a-zA-Z@]/g, '_')
    .replace('@getstream_io', '');
  const userName = session.user?.name || userId;
  return {
    props: {
      apiKey,
      userToken: createToken(streamUserId, secretKey),
      user: {
        id: streamUserId,
        name: userIdOverride || userName,
        image: session.user?.image,
      },
      gleapApiKey,
    } as ServerSideCredentialsProps,
  };
};
