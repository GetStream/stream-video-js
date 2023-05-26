import {
  StreamClientOptions,
  StreamVideoClient,
  TokenOrProvider,
  User,
} from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

/**
 * Exclude types from documentation site, but we should still add doc comments
 * @internal
 */
export type StreamVideoClientInit = {
  /**
   * The Stream API key.
   */
  apiKey: string;
  /**
   * The token or token provider.
   */
  tokenOrProvider: TokenOrProvider;
  /**
   * The client options.
   */
  options?: StreamClientOptions;
  /**
   * The user to connect.
   */
  user: User;
  /**
   * Whether the user is anonymous. Defaults to `false`.
   */
  isAnonymous?: boolean;
};

/**
 * Creates a new `StreamVideoClient` instance and connects the given user.
 *
 * @category Client State
 */
export const useCreateStreamVideoClient = ({
  apiKey,
  tokenOrProvider,
  user,
  options,
  isAnonymous = false,
}: StreamVideoClientInit) => {
  const [client] = useState(() => new StreamVideoClient(apiKey, options));

  const disconnectRef = useRef(Promise.resolve());
  useEffect(() => {
    const connectionPromise = disconnectRef.current.then(() => {
      if (isAnonymous) {
        return client
          .connectAnonymousUser(user, tokenOrProvider)
          .catch((err) => {
            console.error(`Failed to establish connection`, err);
          });
      }
      return client.connectUser(user, tokenOrProvider).catch((err) => {
        console.error(`Failed to establish connection`, err);
      });
    });

    return () => {
      disconnectRef.current = connectionPromise
        .then(() => client.disconnectUser())
        .catch((err) => {
          console.error(`Failed to disconnect`, err);
        });
    };
    // we want to re-run this effect only in some special cases
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, tokenOrProvider, client, isAnonymous, user?.id]);

  return client;
};
