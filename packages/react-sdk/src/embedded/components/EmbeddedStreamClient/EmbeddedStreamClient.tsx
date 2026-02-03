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
  logLevel,
  onError,
  style,
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
        <BackgroundFiltersProvider>
          {noiseCancellation && (
            <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
              <StreamTheme style={style}>
                <CallRouter callType={callType} />
              </StreamTheme>
            </NoiseCancellationProvider>
          )}
        </BackgroundFiltersProvider>
      </StreamCall>
    </StreamVideo>
  );
};
