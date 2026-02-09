import { useInitializeVideoClient } from './useInitializeVideoClient';
import { useInitializeCall } from './useInitializeCall';
import { useNoiseCancellationLoader } from './useNoiseCancellationLoader';
import type { EmbeddedUser, TokenProvider, LogLevel } from '../types';

export interface UseEmbeddedClientProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  callType: string;
  token?: string;
  tokenProvider?: TokenProvider;
  userType?: 'authenticated' | 'guest' | 'anonymous';
  logLevel?: LogLevel;
  onError?: (error: Error) => void;
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
  userType,
  logLevel,
  onError,
}: UseEmbeddedClientProps) => {
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

  const { noiseCancellation, loaded } = useNoiseCancellationLoader();

  return {
    client,
    call,
    noiseCancellation,
    ncLoaded: loaded,
  };
};
