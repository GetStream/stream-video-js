import { useInitializeVideoClient } from './useInitializeVideoClient';
import { useInitializeCall } from './useInitializeCall';
import { useNoiseCancellationLoader } from './useNoiseCancellationLoader';
import type {
  EmbeddedUser,
  EmbeddedErrorType,
  TokenProvider,
  LogLevel,
} from '../types';

export interface UseEmbeddedClientProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  callType: string;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  onError: (error: any, type: EmbeddedErrorType) => void;
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
  onError,
}: UseEmbeddedClientProps) => {
  const client = useInitializeVideoClient({
    apiKey,
    user,
    token,
    tokenProvider,
    logLevel,
    onError,
  });

  const call = useInitializeCall({
    client,
    callType,
    callId,
    onError,
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
