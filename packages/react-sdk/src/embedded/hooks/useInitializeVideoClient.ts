import { useEffect, useMemo, useRef, useState } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-client';
import type {
  EmbeddedUser,
  EmbeddedErrorType,
  LogLevel,
  TokenProvider,
} from '../types';

export interface UseInitializeVideoClientProps {
  apiKey: string;
  user?: EmbeddedUser;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  onError: (error: any, type: EmbeddedErrorType) => void;
}

/**
 * Hook that creates a StreamVideoClient and connects the user.
 * Disconnects and cleans up on unmount or when props change.
 *
 * Connection mode is determined automatically:
 * - Authenticated — provide `user` with `token` or `tokenProvider`
 * - Guest — provide `user` only (server generates credentials)
 * - Anonymous — omit `user` entirely
 */
export const useInitializeVideoClient = ({
  apiKey,
  user,
  token,
  tokenProvider,
  logLevel,
  onError,
}: UseInitializeVideoClientProps): StreamVideoClient | undefined => {
  const [client, setClient] = useState<StreamVideoClient | undefined>();

  const clientRef = useRef<StreamVideoClient | null>(null);
  const tokenProviderRef = useRef(tokenProvider);
  tokenProviderRef.current = tokenProvider;

  const isAnonymous = !user;
  const isAuthenticated = !!user && (!!token || !!tokenProvider);

  const streamUser = useMemo<User>(() => {
    if (isAnonymous) return { type: 'anonymous' };

    if (isAuthenticated)
      return { id: user.id, name: user?.name, image: user?.image };

    return {
      type: 'guest',
      id: user.id,
      name: user?.name,
      image: user?.image,
    };
  }, [isAnonymous, isAuthenticated, user?.id, user?.name, user?.image]);

  useEffect(() => {
    if (!apiKey) return;

    try {
      const _client = new StreamVideoClient({
        apiKey,
        user: streamUser,
        ...(isAuthenticated && {
          token,
          tokenProvider: tokenProviderRef.current,
        }),
        options: logLevel ? { logLevel } : undefined,
      });

      clientRef.current = _client;
      setClient(_client);
    } catch (err) {
      console.error('Failed to initialize StreamVideoClient:', err);
      onError(err, 'client');
    }

    return () => {
      const currentClient = clientRef.current;

      if (currentClient) {
        currentClient
          .disconnectUser()
          .catch((err) => console.error('Failed to disconnect user:', err));

        clientRef.current = null;
        setClient(undefined);
      }
    };
  }, [apiKey, streamUser, isAuthenticated, token, logLevel, onError]);

  return client;
};
