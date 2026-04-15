import { StreamVideoClient, User } from '@stream-io/video-react-sdk';
import { isRecentDeviceSelectionEnabled } from '../hooks/useDeviceSelectionPreference';
import type { AppEnvironment } from '../lib/environmentConfig';
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
    user: User;
    userToken?: string;
    coordinatorUrl?: string;
  },
  environment: AppEnvironment,
) => {
  if (!client) {
    const options = {
      baseURL: creds.coordinatorUrl || process.env.NEXT_PUBLIC_STREAM_API_URL,
      logLevel: 'debug' as const,
      logger: customSentryLogger(),
      transformRequest: defaultRequestTransformers,
      transformResponse: defaultResponseTransformers,
      devicePersistence: {
        enabled: isRecentDeviceSelectionEnabled(),
        storageKey: '@pronto/device-preferences',
      },
    };
    if (creds.user.type === 'guest' || creds.user.type === 'anonymous') {
      client = new StreamVideoClient({
        apiKey: creds.apiKey,
        user: creds.user,
        options,
      });
    } else {
      const tokenProvider = createTokenProvider(creds.user.id, environment);
      if (!creds.userToken && !tokenProvider) {
        throw new Error(
          'Cannot initialize StreamVideoClient with an authenticated user without token or tokenProvider',
        );
      }

      client = new StreamVideoClient({
        apiKey: creds.apiKey,
        user: creds.user,
        ...(creds.userToken
          ? {
              token: creds.userToken,
              ...(tokenProvider ? { tokenProvider } : {}),
            }
          : { tokenProvider: tokenProvider! }),
        options,
      });
    }
  }

  return client;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const createTokenProvider = (
  userId: string | undefined,
  environment: AppEnvironment,
) => {
  if (process.env.NEXT_PUBLIC_APP_ENVIRONMENT === 'pronto-sales') {
    return undefined;
  }

  return async () => {
    const params = new URLSearchParams({
      user_id: userId || '!anon',
      environment,
      exp: String(4 * 60 * 60), // 4 hours
    } satisfies CreateJwtTokenRequest);

    const res = await fetch(`${basePath}/api/auth/create-token?${params}`);
    const json = await ((await res.json()) as Promise<CreateJwtTokenResponse>);
    return json.token;
  };
};
