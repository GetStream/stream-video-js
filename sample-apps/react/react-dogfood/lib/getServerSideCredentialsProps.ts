import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { createToken, decodeToken } from '../helpers/jwt';
import type { User } from '@stream-io/video-react-sdk';

export type ServerSideCredentialsProps = {
  user: User;
  userToken: string;
  apiKey: string;
  gleapApiKey: string | null;
};

type QueryParams = {
  api_key?: string;
  token?: string;
  user_id?: string;
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

  const query = context.query as QueryParams;

  const apiKey = query.api_key || (process.env.STREAM_API_KEY as string);
  const secretKey = process.env.STREAM_SECRET_KEY as string;
  const gleapApiKey = (process.env.GLEAP_API_KEY as string) || null;

  const userIdOverride = query.token
    ? (decodeToken(query.token)['user_id'] as string | undefined)
    : query.user_id;
  const userId = (
    userIdOverride ||
    session?.user?.name ||
    'unknown-user'
  ).replaceAll(' ', '_'); // Otherwise, SDP parse errors with MSID

  // Chat does not allow for Id's to include special characters
  const streamUserId = userId.replace(/[^_\-0-9a-zA-Z@]/g, '_');
  const userName = session.user?.name || userId;

  const token = query.token || createToken(streamUserId, secretKey);
  return {
    props: {
      apiKey,
      userToken: token,
      user: {
        id: streamUserId,
        name: userIdOverride || userName,
        // @ts-expect-error - undefined is not serializable
        image: session.user?.image || null,
      },
      gleapApiKey,
    } satisfies ServerSideCredentialsProps,
  };
};
