import {
  StreamClientOptions,
  TokenOrProvider,
  User,
} from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { StreamClient } from '../coordinator/connection/client';
import { getSdkInfo } from './client-details';
import { SdkType } from '../gen/video/sfu/models/models';
import type { StreamVideoClientOptions } from '../StreamVideoClient';

/**
 * Utility function to get the instance key.
 */
export const getInstanceKey = (apiKey: string, user: User) => {
  return `${apiKey}/${user.id}`;
};

/**
 * Creates a coordinator client.
 */
export const createCoordinatorClient = (
  apiKey: string,
  options: StreamClientOptions | undefined,
) => {
  const coordinatorLogger = getLogger(['coordinator']);
  const streamClient = new StreamClient(apiKey, {
    persistUserOnConnectionFailure: true,
    ...options,
    logger: coordinatorLogger,
  });
  const sdkInfo = getSdkInfo();
  if (sdkInfo) {
    const sdkName = SdkType[sdkInfo.type].toLowerCase();
    const sdkVersion = `${sdkInfo.major}.${sdkInfo.minor}.${sdkInfo.patch}`;
    const userAgent = streamClient.getUserAgent();
    streamClient.setUserAgent(
      `${userAgent}-video-${sdkName}-sdk-${sdkVersion}`,
    );
  }
  return streamClient;
};

/**
 * Creates a token provider and allows integrators to provide
 * a static token and a token provider at the same time.
 *
 * When both of them are provided, this function will create an internal
 * token provider that will use the static token on the first invocation
 * and the token provider on the later invocations.
 */
export const createTokenOrProvider = (
  options: StreamVideoClientOptions,
): TokenOrProvider => {
  const { token, tokenProvider } = options;
  if (token && tokenProvider) {
    let initialTokenUsed = false;
    return async function wrappedTokenProvider(): Promise<string> {
      if (!initialTokenUsed) {
        initialTokenUsed = true;
        return token;
      }
      return tokenProvider();
    };
  }
  return token || tokenProvider;
};
