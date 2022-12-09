import { StreamVideoClient } from '@stream-io/video-client';
import { UserInput } from '@stream-io/video-client/src/gen/video/coordinator/user_v1/user';
import { useEffect, useRef, useState } from 'react';

export type StreamVideoClientInit = {
  apiKey: string;
  token: string;
  coordinatorRpcUrl?: string;
  coordinatorWsUrl?: string;
  user: UserInput;
};

export const useCreateStreamVideoClient = ({
  coordinatorRpcUrl,
  coordinatorWsUrl,
  apiKey,
  token,
  user,
}: StreamVideoClientInit) => {
  const [client] = useState<StreamVideoClient>(
    () =>
      new StreamVideoClient(apiKey, {
        coordinatorWsUrl,
        coordinatorRpcUrl,
        sendJson: true,
        token,
      }),
  );
  const disconnectRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(
    () => {
      const connection = disconnectRef.current.then(() =>
        client?.connect(apiKey, token, user).catch((err) => {
          console.error(`Failed to establish connection`, err);
        }),
      );

      return () => {
        connection?.then(() => {
          disconnectRef.current = client?.disconnect();
          disconnectRef.current.catch((err) => {
            console.error(`Failed to disconnect`, err);
          });
        });
      };
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      apiKey,
      coordinatorRpcUrl,
      coordinatorWsUrl,
      token,
      user.name,
      disconnectRef,
    ],
  );

  return client;
};
