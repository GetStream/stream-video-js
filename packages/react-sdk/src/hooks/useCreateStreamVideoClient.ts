import { StreamVideoClient } from '@stream-io/video-client';
import { UserInput } from '@stream-io/video-client/src/gen/video/coordinator/user_v1/user';
import { useEffect, useState } from 'react';

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
  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const client = new StreamVideoClient(apiKey, {
      coordinatorWsUrl,
      coordinatorRpcUrl,
      sendJson: true,
      token,
    });

    let didInterruptConnect = false;
    const connection = client
      .connect(apiKey, token, user)
      .then(() => {
        if (!didInterruptConnect) {
          setClient(client);
        }
      })
      .catch((err) => {
        console.error(`Failed to establish connection`, err);
      });

    return () => {
      didInterruptConnect = true;
      connection.then(() => {
        client
          .disconnect()
          .then(() => {
            setClient(undefined);
          })
          .catch((err) => {
            console.error(`Failed to disconnect`, err);
          });
      });
    };
  }, [apiKey, coordinatorRpcUrl, coordinatorWsUrl, token, user.name]);

  return client;
};
