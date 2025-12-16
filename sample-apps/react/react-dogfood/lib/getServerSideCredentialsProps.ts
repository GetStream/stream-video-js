import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { createToken, decodeToken } from '../helpers/jwt';
import type { User } from '@stream-io/video-react-sdk';
import { getEnvironmentConfig } from './environmentConfig';
import { getRandomName, sanitizeUserId } from './names';

export type ServerSideCredentialOptions = {
  signInAutomatically?: boolean;
};

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
  environment?: string;
};

export const getServerSideCredentialsPropsWithOptions =
  (options: ServerSideCredentialOptions = {}) =>
  async (
    context: GetServerSidePropsContext,
  ): Promise<GetServerSidePropsResult<ServerSideCredentialsProps>> => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    if (!session) {
      const url = context.req.url;
      const params = new URLSearchParams();
      if (url) params.append('callbackUrl', url);
      if (options.signInAutomatically) params.append('signIn', '1');
      return {
        redirect: {
          destination: `/auth/signin?${params}`,
          permanent: false,
        },
      };
    }

    const query = context.query as QueryParams;

    const environment = query.environment || 'pronto';
    const appConfig = getEnvironmentConfig(environment);

    const apiKey =
      query.api_key ||
      appConfig.apiKey ||
      (process.env.STREAM_API_KEY as string);
    const secretKey =
      appConfig.secret || (process.env.STREAM_SECRET_KEY as string);
    const gleapApiKey = (process.env.GLEAP_API_KEY as string) || null;

    const userIdOverride = query.token && decodeToken(query.token)['user_id'];
    const userId =
      userIdOverride || query.user_id || session.user?.streamUserId;

    if (!userId) {
      return {
        redirect: {
          destination: `/auth/signout`,
          permanent: false,
        },
      };
    }

    // Chat does not allow for Id's to include special characters
    const streamUserId = sanitizeUserId(userId);

    const isProntoSales =
      process.env.NEXT_PUBLIC_APP_ENVIRONMENT === 'pronto-sales';
    const token =
      query.token ||
      (await createToken(
        streamUserId,
        apiKey,
        secretKey,
        session.user?.stream
          ? {
              ...(isProntoSales ? { role: 'stream' } : {}),
              name: session.user?.name,
              image: session.user?.image,
              email: session.user?.email,
            }
          : undefined,
      ));

    return {
      props: {
        apiKey,
        userToken: token,
        user: {
          id: streamUserId,
          ...(session.user?.name
            ? { name: session.user.name }
            : { name: isProntoSales ? '' : getRandomName() }),
          ...(session.user?.image ? { image: session.user.image } : {}),
        },
        gleapApiKey,
      },
    };
  };

export const getServerSideCredentialsProps =
  getServerSideCredentialsPropsWithOptions();
