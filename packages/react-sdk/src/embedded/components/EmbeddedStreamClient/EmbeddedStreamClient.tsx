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
import { ConfigurationProvider } from '../../context';
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
  logLevel,
  onError,
  style,
  skipLobby,
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
      <StreamTheme style={style}>
        <LoadingScreen />
      </StreamTheme>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ConfigurationProvider skipLobby={skipLobby}>
          <BackgroundFiltersProvider SuspenseFallback={<LoadingScreen />}>
            {noiseCancellation && (
              <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
                <StreamTheme style={style}>
                  <CallRouter callType={callType} />
                </StreamTheme>
              </NoiseCancellationProvider>
            )}
          </BackgroundFiltersProvider>
        </ConfigurationProvider>
      </StreamCall>
    </StreamVideo>
  );
};
