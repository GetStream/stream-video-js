import { StreamCall, StreamVideo } from '../../../core';
import {
  StreamTheme,
  BackgroundFiltersProvider,
  NoiseCancellationProvider,
} from '../../../components';

import type { EmbeddedStreamClientProps } from '../../types';
import {
  useInitializeVideoClient,
  useInitializeCall,
  useNoiseCancellationLoader,
} from '../../hooks';
import { ConfigurationProvider } from '../../context';
import { CallRouter } from '../CallRouter';

/**
 * EmbeddedStreamClient
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
  ...configProps
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
    return null;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ConfigurationProvider {...configProps}>
          <BackgroundFiltersProvider>
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
