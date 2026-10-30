import { LaunchArguments } from 'react-native-launch-arguments';

type E2eLaunchArguments = {
  /** Prefills the call id field, like `EXTRA_CALL_ID` in the Android demo app. */
  CALL_ID?: string;
  /** The client's log level (`E2E_LOG_LEVEL` in the suite), e.g. `debug` to see why a join hangs. */
  LOG_LEVEL?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
};

const launchArguments = LaunchArguments.value<E2eLaunchArguments>();

/** The call id the suite passes on launch; the user can still type another one. */
export const launchCallId = launchArguments.CALL_ID;

export const logLevel = launchArguments.LOG_LEVEL;

/**
 * The `demo` environment, the one stream-video-buddy joins through
 * https://getstream.io/video/demos, so both sides end up on the same call.
 */
export const environment = 'demo';

const tokenEndpoint = 'https://pronto.getstream.io/api/auth/create-token';

export const createToken = async (userId: string) => {
  const url = new URL(tokenEndpoint);
  url.searchParams.set('user_id', userId);
  url.searchParams.set('environment', environment);
  url.searchParams.set('exp', String(4 * 60 * 60));
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }
  const { apiKey, token } = (await response.json()) as {
    apiKey: string;
    token: string;
  };
  return { apiKey, token };
};

export const randomId = (length = 8) =>
  Math.random()
    .toString(36)
    .slice(2, 2 + length);
