import { useEffect, useState } from 'react';
import { StreamVideoClient, UserRequest } from '@stream-io/video-client';

export const useStreamVideoClient = (
  baseUrl: string,
  apiKey: string,
  token: string,
  user: UserRequest,
) => {
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  useEffect(() => {
    const client = new StreamVideoClient(apiKey, {
      baseUrl,
      sendJson: true,
      token,
    });

    let didInterruptConnect = false;
    const connection = client
      .connect(token, user)
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
  }, [apiKey, baseUrl, token, user]);

  return client;
};
