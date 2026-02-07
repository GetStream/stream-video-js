import { useEffect, useMemo, useRef, useState } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-client';
import type { EmbeddedUser, LogLevel, TokenProvider, UserType } from '../types';

export interface UseInitializeVideoClientProps {
  apiKey: string;
  user: EmbeddedUser;
  token?: string;
  tokenProvider?: TokenProvider;
  userType?: UserType;
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
  token,
  tokenProvider,
  userType,
  logLevel,
  onError,
}: UseInitializeVideoClientProps): StreamVideoClient | undefined => {
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  const clientRef = useRef<StreamVideoClient | null>(null);

  // Stabilize user object to prevent re-initialization on every render
  // when the consumer passes an inline object literal.
  const stableUser = useMemo(
    () => user,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.id, user.name, user.image],
  );

  useEffect(() => {
    if (!apiKey) return;

    const effectiveUserType =
      userType ?? (token || tokenProvider ? 'authenticated' : 'anonymous');

    const streamUser = createUser(stableUser, effectiveUserType);

    try {
      const _client = new StreamVideoClient({
        apiKey,
        user: streamUser,
        token: effectiveUserType === 'authenticated' ? token : undefined,
        tokenProvider:
          effectiveUserType === 'authenticated' ? tokenProvider : undefined,
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
  }, [apiKey, stableUser, token, tokenProvider, userType, logLevel, onError]);

  return client;
};

const createUser = (user: EmbeddedUser, userType: UserType): User => {
  const { id, name, image } = user;

  switch (userType) {
    case 'authenticated':
      if (!id) throw new Error('User ID is required for authenticated users');
      return { id, name, image };
    case 'guest':
      return { type: 'guest', id, name, image };
    case 'anonymous':
      return { type: 'anonymous' };
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }
};
