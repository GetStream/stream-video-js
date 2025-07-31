import { StreamVideoClient, User } from '@stream-io/video-react-sdk';
import { AppEnvironment } from '../context/AppEnvironmentContext';
import {
  CreateJwtTokenRequest,
  CreateJwtTokenResponse,
} from '../pages/api/auth/create-token';
import {
  defaultRequestTransformers,
  defaultResponseTransformers,
} from './axiosApiTransformers';
import { customSentryLogger } from './logger';

let client: StreamVideoClient | undefined;

/**
 * Lazily initializes video client. Credentials are captured on the first
 * call, and ignored for subsequent calls.
 */
export const getClient = (
  creds: {
    apiKey: string;
    user?: User;
    userToken?: string;
    coordinatorUrl?: string;
  },
  environment: AppEnvironment,
) => {
  if (!client) {
    client = new StreamVideoClient({
      apiKey: creds.apiKey,
      user: creds.user,
      token: creds.userToken,
      tokenProvider: createTokenProvider(creds.user?.id, environment),
      options: {
        baseURL: creds.coordinatorUrl || process.env.NEXT_PUBLIC_STREAM_API_URL,
        logLevel: 'debug',
        logger: customSentryLogger(),
        transformRequest: defaultRequestTransformers,
        transformResponse: defaultResponseTransformers,
      },
    });
  }

  return client;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const createTokenProvider =
  (userId: string | undefined, environment: AppEnvironment) => async () => {
    const params = new URLSearchParams({
      user_id: userId || '!anon',
      environment,
      exp: String(4 * 60 * 60), // 4 hours
    } satisfies CreateJwtTokenRequest);

    const res = await fetch(`${basePath}/api/auth/create-token?${params}`);
    const json = await ((await res.json()) as Promise<CreateJwtTokenResponse>);
    return json.token;
  };
