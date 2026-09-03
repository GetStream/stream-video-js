import {
  StreamClientOptions,
  StreamVideoClient,
  TokenOrProvider,
  User,
} from '@stream-io/video-react-sdk';
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
let connection: { user: User; tokenOrProvider: TokenOrProvider } | undefined;

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
    const options: StreamClientOptions = {
      baseURL: creds.coordinatorUrl || process.env.NEXT_PUBLIC_STREAM_API_URL,
      logLevel: 'debug' as const,
      logger: customSentryLogger(),
      transformRequest: defaultRequestTransformers,
      transformResponse: defaultResponseTransformers,
      clientAppIdentifier: { app: environment },
      devicePersistence: {
        enabled: isRecentDeviceSelectionEnabled(),
        storageKey: '@pronto/device-preferences',
      },
    };
    if (creds.user.type === 'guest' || creds.user.type === 'anonymous') {
      connection = { user: creds.user, tokenOrProvider: undefined };
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

      connection = {
        user: creds.user,
        tokenOrProvider: tokenProvider ?? creds.userToken,
      };
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

/**
 * Applies a display name to the connected user.
 *
 * The coordinator reads the user's name from the WebSocket auth payload, which
 * is built from the credentials captured by {@link getClient}. A name picked
 * later (in the lobby) therefore only reaches the coordinator - and survives
 * WebSocket reconnects - once the user reconnects with it.
 */
export const applyDisplayName = async (name: string) => {
  if (!client || !connection) return;
  const { user, tokenOrProvider } = connection;
  // anonymous users share the `!anon` id and carry no profile to rename
  if (user.type === 'anonymous' || !name || user.name === name) return;

  // The client is a singleton, and pages such as the pre-call test disconnect
  // it when they unmount. Reconnecting a client this helper no longer owns
  // would restore an identity the current page never asked for. Guests skip
  // the id check: the coordinator, not the caller, assigns their id.
  const connectedUser = client.state.connectedUser;
  if (!connectedUser) return;
  if (user.type !== 'guest' && connectedUser.id !== user.id) return;

  const nextUser: User = { ...user, name };
  await client.disconnectUser();
  await client.connectUser(nextUser, tokenOrProvider);
  connection = { user: nextUser, tokenOrProvider };
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
