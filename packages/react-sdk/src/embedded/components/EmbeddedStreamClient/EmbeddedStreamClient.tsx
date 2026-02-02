import { StreamCall, StreamVideo } from '../../../core';
import {
  StreamTheme,
  BackgroundFiltersProvider,
  NoiseCancellationProvider,
} from '../../../components';
import { LoadingScreen } from '../shared';

import type { EmbeddedStreamClientProps } from '../../types';
import {
  useInitializeVideoClient,
  useInitializeCall,
  useNoiseCancellationLoader,
} from '../../hooks';
import { CallRouter } from '../CallRouter';

/**
 * EmbeddedStreamClient - A self-contained video calling component.
 *
 */
export const EmbeddedStreamClient = ({
  apiKey,
  user,
  callId,
  callType = 'default',
  token,
  tokenProvider,
  userType,
  skipLobby = false,
  logLevel,
  onError,
}: EmbeddedStreamClientProps) => {
  const client = useInitializeVideoClient({
    apiKey,
    user,
    token,
    tokenProvider,
    userType,
    logLevel,
    onError,
  });

  const call = useInitializeCall({
    client,
    callType,
    callId,
    onError,
  });

  const noiseCancellation = useNoiseCancellationLoader();

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
        <BackgroundFiltersProvider>
          {noiseCancellation && (
            <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
              <StreamTheme style={{}}>
                <CallRouter callType={callType} skipLobby={skipLobby} />
              </StreamTheme>
            </NoiseCancellationProvider>
          )}
        </BackgroundFiltersProvider>
      </StreamCall>
    </StreamVideo>
  );
};
