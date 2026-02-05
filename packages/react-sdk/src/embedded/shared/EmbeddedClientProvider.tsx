import type { CSSProperties, ReactNode } from 'react';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';

import { StreamCall, StreamVideo } from '../../core';
import {
  StreamTheme,
  BackgroundFiltersProvider,
  NoiseCancellationProvider,
} from '../../components';
import { ConfigurationProvider } from '../context';
import { useEmbeddedClient, useWakeLock } from '../hooks';
import type {
  EmbeddedUser,
  TokenProvider,
  LogLevel,
  LayoutOption,
} from '../types';
import { LoadingScreen } from './LoadingScreen';

export interface EmbeddedClientProviderProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  callType: string;
  token?: string;
  tokenProvider?: TokenProvider;
  userType?: 'authenticated' | 'guest' | 'anonymous';
  logLevel?: LogLevel;
  onError?: (error: Error) => void;
  layout?: LayoutOption;
  style?: CSSProperties;
  children: ReactNode;
}

const NoiseCancellationWrapper = ({
  noiseCancellation,
  children,
}: {
  noiseCancellation?: INoiseCancellation;
  children: ReactNode;
}) => {
  if (!noiseCancellation) {
    return <>{children}</>;
  }
  return (
    <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
      {children}
    </NoiseCancellationProvider>
  );
};

const InnerProvider = ({
  noiseCancellation,
  layout,
  onError,
  style,
  children,
}: {
  noiseCancellation?: INoiseCancellation;
  layout?: LayoutOption;
  onError?: (error: Error) => void;
  style?: CSSProperties;
  children: ReactNode;
}) => {
  useWakeLock();

  return (
    <ConfigurationProvider layout={layout} onError={onError}>
      <BackgroundFiltersProvider>
        <NoiseCancellationWrapper noiseCancellation={noiseCancellation}>
          <StreamTheme style={style}>{children}</StreamTheme>
        </NoiseCancellationWrapper>
      </BackgroundFiltersProvider>
    </ConfigurationProvider>
  );
};

/**
 * Shared provider wrapper for embedded components.
 * Handles client/call initialization and wraps children with all necessary providers.
 */
export const EmbeddedClientProvider = ({
  apiKey,
  user,
  callId,
  callType,
  token,
  tokenProvider,
  userType,
  logLevel,
  onError,
  layout,
  style,
  children,
}: EmbeddedClientProviderProps) => {
  const { client, call, noiseCancellation } = useEmbeddedClient({
    apiKey,
    user,
    callId,
    callType,
    token,
    tokenProvider,
    userType,
    logLevel,
    onError,
  });

  if (!call || !client || !noiseCancellation) {
    return (
      <StreamTheme>
        <LoadingScreen />
      </StreamTheme>
    );
  }

  return (
    <StreamVideo client={client!}>
      <StreamCall call={call!}>
        <InnerProvider
          noiseCancellation={noiseCancellation}
          layout={layout}
          onError={onError}
          style={style}
        >
          {children}
        </InnerProvider>
      </StreamCall>
    </StreamVideo>
  );
};
