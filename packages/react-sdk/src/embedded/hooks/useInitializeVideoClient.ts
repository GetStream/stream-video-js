import { useEffect, useRef, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-client';
import { useEffectEvent } from '@stream-io/video-react-bindings';
import type { EmbeddedUser, LogLevel, TokenProvider } from '../types';

export interface UseInitializeVideoClientProps {
  apiKey: string;
  user?: EmbeddedUser;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  onError?: (error: Error) => void;
}

/**
 * Hook to initialize and manage a StreamVideoClient instance.
 * Handles user connection and cleanup on unmount.
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
  const handleError = useEffectEvent(onError ?? (() => {}));

  useEffect(() => {
    if (!apiKey) return;

    try {
      const _client = new StreamVideoClient({
        apiKey,
        user: !user
          ? { type: 'anonymous' }
          : user.type === 'guest'
            ? { type: 'guest', id: user.id, name: user.name, image: user.image }
            : { id: user.id, name: user.name, image: user.image },
        ...(user && user.type !== 'guest' && { token, tokenProvider }),
        options: logLevel ? { logLevel } : undefined,
      });

      clientRef.current = _client;
      setClient(_client);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to initialize StreamVideoClient:', error);
      handleError(error);
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
  }, [
    apiKey,
    user?.id,
    user?.name,
    user?.image,
    user?.type,
    token,
    tokenProvider,
    logLevel,
    user,
  ]);

  return client;
};
