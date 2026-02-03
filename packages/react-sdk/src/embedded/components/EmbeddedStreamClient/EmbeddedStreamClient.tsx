import { useCallback, useRef, useState } from 'react';
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
  user: initialUser,
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
  const [user, setUser] = useState(initialUser);
  const autoJoin = useRef(!!skipLobby);

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
    autoJoin,
  });

  const noiseCancellation = useNoiseCancellationLoader();

  const handleReJoin = useCallback((name: string) => {
    autoJoin.current = true;
    setUser((prev) => ({ ...prev, name: name.trim() }));
  }, []);

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
        <BackgroundFiltersProvider SuspenseFallback={<LoadingScreen />}>
          {noiseCancellation && (
            <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
              <StreamTheme style={style}>
                <CallRouter callType={callType} onJoin={handleReJoin} />
              </StreamTheme>
            </NoiseCancellationProvider>
          )}
        </BackgroundFiltersProvider>
      </StreamCall>
    </StreamVideo>
  );
};
