import type {
  ClientAppIdentifier,
  StreamClientOptions,
  TokenOrProvider,
  User,
} from '../coordinator/connection/types';
import { StreamClient as LegacyStreamClient } from '../coordinator/connection/client';
import { StreamClient as NewStreamClient } from '../coordinator/connection/coordinator-client';
import { getSdkInfo } from './client-details';
import { SdkType } from '../gen/video/sfu/models/models';
import type { StreamVideoClientOptions } from '../types';

/**
 * Utility function to get the instance key.
 */
export const getInstanceKey = (apiKey: string, user: User) => {
  return `${apiKey}/${user.id}`;
};

/**
 * Returns a concurrency tag for call initialization.
 * @internal
 *
 * @param cid the call cid.
 */
export const getCallInitConcurrencyTag = (cid: string) => `call.init-${cid}`;

/**
 * Utility function to get the client app identifier.
 */
const getClientAppIdentifier = (
  options?: StreamClientOptions,
): ClientAppIdentifier => {
  const appId = options?.clientAppIdentifier || {};
  const sdkInfo = getSdkInfo();
  if (sdkInfo) {
    // ensure the sdk name and version are set correctly,
    // overriding any user-provided values
    appId.sdkName = SdkType[sdkInfo.type].toLowerCase();
    appId.sdkVersion = `${sdkInfo.major}.${sdkInfo.minor}.${sdkInfo.patch}`;
  }
  return appId;
};

/**
 * Creates a coordinator client.
 *
 * Returns a {@link LegacyStreamClient}-typed value so existing call sites
 * (Call.ts, StreamSfuClient.ts, StreamVideoClient.ts) keep their type
 * annotations unchanged. During the F15 validation window the new client at
 * `coordinator-client.ts` is structurally assignable to the legacy class
 * because (a) the public surface matches and (b) the F11 deprecated aliases
 * are kept on the new class. The `as unknown` cast is the single TS gymnastic
 * required to land both implementations behind one factory.
 */
export const createCoordinatorClient = (
  apiKey: string,
  options: StreamClientOptions | undefined,
): LegacyStreamClient => {
  const clientAppIdentifier = getClientAppIdentifier(options);
  const baseOptions: StreamClientOptions = {
    persistUserOnConnectionFailure: true,
    ...options,
    clientAppIdentifier,
  };

  if (options?.useLegacyCoordinator) {
    return new LegacyStreamClient(apiKey, baseOptions);
  }
  return new NewStreamClient(
    apiKey,
    baseOptions,
  ) as unknown as LegacyStreamClient;
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
