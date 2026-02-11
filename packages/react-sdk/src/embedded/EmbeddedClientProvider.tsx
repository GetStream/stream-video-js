import {
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { useEffectEvent as useEffectEventShim } from '@stream-io/video-react-bindings';

import { StreamCall, StreamVideo } from '../core';
import {
  StreamTheme,
  BackgroundFiltersProvider,
  NoiseCancellationProvider,
} from '../components';
import { ConfigurationProvider } from './context';
import { useEmbeddedClient } from './hooks';
import type {
  EmbeddedUser,
  EmbeddedErrorType,
  TokenProvider,
  LogLevel,
  LayoutOption,
} from './types';
import { LoadingIndicator } from '../components';

const errorMessages: Record<EmbeddedErrorType, string> = {
  client: 'Failed to connect. Please check your connection and try again.',
  call: 'This call is unavailable.',
  join: 'Failed to join. Please try again.',
};

export interface EmbeddedClientProviderProps {
  apiKey: string;
  user?: EmbeddedUser;
  callId: string;
  callType: string;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  onError?: (error: any) => void;
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
  logLevel,
  onError,
  layout,
  style,
  children,
}: EmbeddedClientProviderProps) => {
  const [errorType, setErrorType] = useState<EmbeddedErrorType>();

  const onErrorStable = useEffectEventShim(onError ?? (() => {}));
  const handleError = useCallback(
    (error: any, type: EmbeddedErrorType) => {
      setErrorType(type);
      onErrorStable(error);
    },
    [onErrorStable],
  );

  const { client, call, noiseCancellation } = useEmbeddedClient({
    apiKey,
    user,
    callId,
    callType,
    token,
    tokenProvider,
    logLevel,
    onError: handleError,
  });

  if (errorType) {
    return (
      <StreamTheme className="str-video__embedded">
        <div className="str-video__embedded-error">
          <p className="str-video__embedded-error__message">
            {errorMessages[errorType]}
          </p>
        </div>
      </StreamTheme>
    );
  }

  if (!call || !client) {
    return (
      <StreamTheme className="str-video__embedded">
        <LoadingIndicator className="str-video__embedded-loading" />
      </StreamTheme>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ConfigurationProvider layout={layout} onError={handleError}>
          <BackgroundFiltersProvider>
            <NoiseCancellationWrapper noiseCancellation={noiseCancellation}>
              <StreamTheme className="str-video__embedded" style={style}>
                {children}
              </StreamTheme>
            </NoiseCancellationWrapper>
          </BackgroundFiltersProvider>
        </ConfigurationProvider>
      </StreamCall>
    </StreamVideo>
  );
};
