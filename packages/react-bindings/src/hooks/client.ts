import {
  CallConfig,
  StreamClientOptions,
  StreamVideoClient,
  TokenOrProvider,
  User,
} from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type StreamVideoClientInit = {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  callConfig?: CallConfig;
  options?: StreamClientOptions;
  user: User | undefined;
};

/**
 * Utility hook which instantiate a video client and connects the user.
 * @category Client Operations
 */
export const useCreateStreamVideoClient = ({
  apiKey,
  tokenOrProvider,
  user,
  options,
  callConfig,
}: StreamVideoClientInit) => {
  const [client] = useState(
    () => new StreamVideoClient(apiKey, options, callConfig),
  );
  const disconnectRef = useRef(Promise.resolve());

  useEffect(() => {
    // if user is not defined, we don't want to connect. this happens in some of our use cases
    if (!user) return;

    const connection = disconnectRef.current.then(() => {
      return client.connectUser(user, tokenOrProvider).catch((err) => {
        console.error(`Failed to establish connection`, err);
      });
    });

    return () => {
      connection.then(() => {
        disconnectRef.current = client.disconnectUser();
        disconnectRef.current.catch((err) => {
          console.error(`Failed to disconnect`, err);
        });
      });
    };
    // we want to re-run this effect only in some special cases
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, tokenOrProvider, client, user?.id]);

  return client;
};
