import { StreamCall, StreamVideo } from '../../../core';
import { StreamTheme } from '../../../components';
import { LoadingScreen } from '../shared';

import type { EmbeddedStreamClientProps } from '../../types';
import {
  useInitializeVideoClient,
  useInitializeCall,
  useNoiseCancellationLoader,
} from '../../hooks';
import { CallRouter } from '../CallRouter';
import {
  ConditionalBackgroundFiltersProvider,
  ConditionalNoiseCancellationProvider,
} from '../providers';

/**
 * EmbeddedStreamClient - A self-contained video calling component.
 *
 */
export const EmbeddedStreamClient = ({
  apiKey,
  user,
  call: callConfig,
  tokenProvider,
  skipLobby = false,
  logLevel,
  enableNoiseCancellation = true,
  enableBackgroundFilters = true,
  onError,
}: EmbeddedStreamClientProps) => {
  const client = useInitializeVideoClient({
    apiKey,
    user,
    tokenProvider,
    logLevel,
    onError,
  });

  const call = useInitializeCall({
    client,
    callType: callConfig.type || 'default',
    callId: callConfig.id,
    onError,
  });

  const noiseCancellation = useNoiseCancellationLoader(enableNoiseCancellation);

  if (!client || !call) {
    return (
      <StreamTheme style={{}}>
        <LoadingScreen />
      </StreamTheme>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ConditionalBackgroundFiltersProvider enabled={enableBackgroundFilters}>
          <ConditionalNoiseCancellationProvider
            enabled={enableNoiseCancellation}
            noiseCancellation={noiseCancellation}
          >
            <StreamTheme style={{}}>
              <CallRouter
                callType={callConfig.type || 'default'}
                skipLobby={skipLobby}
              />
            </StreamTheme>
          </ConditionalNoiseCancellationProvider>
        </ConditionalBackgroundFiltersProvider>
      </StreamCall>
    </StreamVideo>
  );
};
