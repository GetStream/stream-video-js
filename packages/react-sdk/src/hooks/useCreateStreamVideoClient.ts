import { StreamVideoClient, CallConfig, User } from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

export type StreamVideoClientInit = {
  apiKey: string;
  token: string;
  callConfig?: CallConfig;
  coordinatorRpcUrl?: string;
  user: User;
};

export const useCreateStreamVideoClient = ({
  callConfig,
  coordinatorRpcUrl,
  apiKey,
  token,
  user,
}: StreamVideoClientInit) => {
  const [client] = useState<StreamVideoClient>(
    () =>
      new StreamVideoClient(
        apiKey,
        {
          coordinatorRpcUrl,
          token,
        },
        callConfig,
      ),
  );
  const disconnectRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const connection = disconnectRef.current.then(() =>
      // FIXME: OL: await until connection is established, then return client
      client.connectUser(user, token).catch((err) => {
        console.error(`Failed to establish connection`, err);
      }),
    );

    return () => {
      connection.then(() => {
        disconnectRef.current = client.disconnectUser();
        disconnectRef.current.catch((err) => {
          console.error(`Failed to disconnect`, err);
        });
      });
    };
  }, [apiKey, coordinatorRpcUrl, token, client, user.id]);

  return client;
};
