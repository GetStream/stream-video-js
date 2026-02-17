import { useEffect, useMemo, useRef, useState } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-client';
import type { EmbeddedUser, LogLevel, TokenProvider } from '../types';

export interface UseInitializeVideoClientProps {
  apiKey: string;
  user: EmbeddedUser;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  handleError: (error: any) => void;
}

/**
 * Hook that creates a StreamVideoClient and connects the user.
 * Disconnects and cleans up on unmount or when props change.
 *
 */
export const useInitializeVideoClient = ({
  apiKey,
  user,
  token,
  tokenProvider,
  logLevel,
  handleError,
}: UseInitializeVideoClientProps): StreamVideoClient | undefined => {
  const [client, setClient] = useState<StreamVideoClient | undefined>();

  const clientRef = useRef<StreamVideoClient | null>(null);

  const tokenProviderRef = useRef(tokenProvider);
  tokenProviderRef.current = tokenProvider;

  const streamUser = useMemo<User>(() => {
    const base = {
      name: user.name,
      image: user.image,
    };

    switch (user.type) {
      case 'anonymous':
        return {
          ...base,
          id: '!anon',
          type: 'anonymous',
        };

      case 'guest':
        return {
          ...base,
          id: user.id!,
          type: 'guest',
        };

      case 'authenticated':
        return {
          ...base,
          id: user.id,
        };
      default: {
        throw new Error(`Unsupported user type`);
      }
    }
  }, [user.type, user.id, user.name, user.image]);

  useEffect(() => {
    if (!apiKey) return;

    try {
      const _client = new StreamVideoClient({
        apiKey,
        user: streamUser,
        token,
        tokenProvider: tokenProviderRef.current,
        options: logLevel ? { logLevel } : undefined,
      });

      clientRef.current = _client;
      setClient(_client);
    } catch (err) {
      handleError(err);
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
  }, [apiKey, streamUser, token, logLevel, handleError]);

  return client;
};
