import { useEffect, useRef, useState } from 'react';
import {
  LogLevel,
  StreamVideoClient,
  TokenProvider,
  User,
} from '@stream-io/video-client';
import type { EmbeddedUser } from '../types';

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

  const tokenProviderRef = useRef(tokenProvider);
  tokenProviderRef.current = tokenProvider;

  useEffect(() => {
    if (!apiKey) return;

    const options = logLevel ? { logLevel } : undefined;
    let _client: StreamVideoClient | undefined;
    try {
      if (user?.type === 'guest') {
        const streamUser: User = {
          id: user.id,
          type: 'guest',
          name: user.name,
          image: user.image,
        };

        _client = new StreamVideoClient({
          apiKey,
          user: streamUser,
          options,
        });
      } else if (user?.type === 'anonymous') {
        const streamUser: User = {
          id: '!anon',
          type: 'anonymous',
          name: user.name,
          image: user.image,
        };

        _client = new StreamVideoClient({
          apiKey,
          user: streamUser,
          token,
          tokenProvider: tokenProviderRef.current,
          options,
        });
      } else {
        const streamUser: User = {
          id: user.id,
          name: user.name,
          image: user.image,
        };

        const currentTokenProvider = tokenProviderRef.current;
        _client = new StreamVideoClient({
          apiKey,
          user: streamUser,
          ...(token
            ? {
                token,
                ...(currentTokenProvider
                  ? { tokenProvider: currentTokenProvider }
                  : {}),
              }
            : { tokenProvider: currentTokenProvider! }),
          options,
        });
      }

      setClient(_client);
    } catch (err) {
      handleError(err);
    }

    return () => {
      _client
        ?.disconnectUser()
        .catch((err) => console.error('Failed to disconnect user:', err));

      setClient(undefined);
    };
  }, [
    apiKey,
    user.id,
    user.type,
    user.name,
    user.image,
    token,
    logLevel,
    handleError,
  ]);

  return client;
};
