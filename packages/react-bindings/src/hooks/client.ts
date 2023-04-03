import {
  StreamVideoClient,
  User,
  TokenOrProvider,
  StreamClientOptions,
} from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type StreamVideoClientInit = {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  options?: StreamClientOptions;
  user: User;
};

/**
 *
 * @param param0
 * @returns
 *
 * @category Client State
 */
export const useCreateStreamVideoClient = ({
  apiKey,
  tokenOrProvider,
  user,
  options,
}: StreamVideoClientInit) => {
  const [client] = useState(() => new StreamVideoClient(apiKey, options));

  const disconnectRef = useRef(Promise.resolve());
  useEffect(() => {
    const connectionPromise = disconnectRef.current.then(() => {
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
  }, [apiKey, tokenOrProvider, client, user.id]);

  return client;
};
