import { useCallback, useState, type ReactNode } from 'react';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { useEffectEvent as useEffectEventShim } from '@stream-io/video-react-bindings';

import { StreamCall, StreamVideo } from '../core';
import {
  StreamTheme,
  type StreamThemeMode,
  BackgroundFiltersProvider,
  NoiseCancellationProvider,
} from '../components';
import { ConfigurationProvider } from './context';
import { useEmbeddedClient } from './hooks';
import type { LogLevel, TokenProvider } from '@stream-io/video-client';
import type { EmbeddedUser, LayoutOption } from './types';
import { LoadingIndicator } from '../components';

interface EmbeddedClientContentProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  callType: string;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  onError?: (error: any) => void;
  layout?: LayoutOption;
  children: ReactNode;
}

export interface EmbeddedClientProviderProps extends EmbeddedClientContentProps {
  theme?: StreamThemeMode;
  style?: Record<string, string>;
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

/**
 * Shared provider wrapper for embedded components.
 * Handles client/call initialization and wraps children with all necessary providers.
 */
export const EmbeddedClientProvider = ({
  theme = 'dark',
  style,
  ...props
}: EmbeddedClientProviderProps) => (
  <StreamTheme className="str-video__embedded" theme={theme} style={style}>
    <EmbeddedClientContent {...props} />
  </StreamTheme>
);

const EmbeddedClientContent = ({
  apiKey,
  user,
  callId,
  callType,
  token,
  tokenProvider,
  logLevel,
  onError,
  layout,
  children,
}: EmbeddedClientContentProps) => {
  const [showError, setShowError] = useState<boolean>(false);

  const onErrorStable = useEffectEventShim(onError ?? console.error);
  const handleError = useCallback(
    (error: any) => {
      setShowError(true);
      onErrorStable(error);
    },
    [onErrorStable],
  );

  const { client, call, noiseCancellation, noiseCancellationReady } =
    useEmbeddedClient({
      apiKey,
      user,
      callId,
      callType,
      token,
      tokenProvider,
      logLevel,
      handleError,
    });

  if (showError) {
    return (
      <div className="str-video__embedded-error">
        <p className="str-video__embedded-error__message">
          An error occurred while initializing the client. Please try again
          later.
        </p>
      </div>
    );
  }

  if (!call || !client || !noiseCancellationReady) {
    return <LoadingIndicator className="str-video__embedded-loading" />;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ConfigurationProvider layout={layout} onError={onErrorStable}>
          <BackgroundFiltersProvider>
            <NoiseCancellationWrapper noiseCancellation={noiseCancellation}>
              {children}
            </NoiseCancellationWrapper>
          </BackgroundFiltersProvider>
        </ConfigurationProvider>
      </StreamCall>
    </StreamVideo>
  );
};
