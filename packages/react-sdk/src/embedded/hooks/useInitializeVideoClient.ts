import { useEffect, useRef, useState } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-client';
import type { EmbeddedUser, LogLevel, TokenProvider } from '../types';

export interface UseInitializeVideoClientProps {
  apiKey: string;
  user: EmbeddedUser;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  onError?: (error: Error) => void;
}

/**
 * Hook to initialize and manage a StreamVideoClient instance.
 * Uses getOrCreateInstance to ensure singleton behavior.
 * Handles user connection and cleanup on unmount.
 */
export const useInitializeVideoClient = ({
  apiKey,
  user,
  tokenProvider,
  logLevel,
  onError,
}: UseInitializeVideoClientProps): StreamVideoClient | undefined => {
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  const clientRef = useRef<StreamVideoClient | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    const streamUser = createUser(user);

    try {
      const _client = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: streamUser,
        token: user?.type === 'authenticated' ? user.token : undefined,
        tokenProvider:
          user?.type === 'authenticated' ? tokenProvider : undefined,
        options: logLevel ? { logLevel } : undefined,
      });

      clientRef.current = _client;
      setClient(_client);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to initialize StreamVideoClient:', error);
      onError?.(error);
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
  }, [apiKey, user, tokenProvider, logLevel, onError]);

  return client;
};

const createUser = (user: EmbeddedUser): User => {
  const { type, id, name, image } = user;

  switch (type) {
    case 'authenticated':
      if (!id) throw new Error('User ID is required for authenticated users');
      return { id, name, image };
    case 'guest':
      return { type: 'guest', id: id, name, image };
    case 'anonymous':
      return { type: 'anonymous' };
    default:
      throw new Error(`Unknown user type: ${type}`);
  }
};
