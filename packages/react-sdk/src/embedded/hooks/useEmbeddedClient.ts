import { useInitializeVideoClient } from './useInitializeVideoClient';
import { useInitializeCall } from './useInitializeCall';
import { useNoiseCancellationLoader } from './useNoiseCancellationLoader';
import type { EmbeddedUser } from '../types';
import { LogLevel, TokenProvider } from '@stream-io/video-client';

export interface UseEmbeddedClientProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  callType: string;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  handleError: (error: any) => void;
}

/**
 * Hook that initializes the Stream Video client and call.
 * Combines useInitializeVideoClient, useInitializeCall, and useNoiseCancellationLoader.
 */
export const useEmbeddedClient = ({
  apiKey,
  user,
  callId,
  callType,
  token,
  tokenProvider,
  logLevel,
  handleError,
}: UseEmbeddedClientProps) => {
  const client = useInitializeVideoClient({
    apiKey,
    user,
    token,
    tokenProvider,
    logLevel,
    handleError,
  });

  const call = useInitializeCall({
    client,
    callType,
    callId,
    handleError,
  });

  const { noiseCancellation, ready: noiseCancellationReady } =
    useNoiseCancellationLoader(call);

  return {
    client,
    call,
    noiseCancellation,
    noiseCancellationReady,
  };
};
