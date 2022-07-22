import { useEffect, useState } from 'react';
import { StreamVideoClient, UserRequest } from '@stream-io/video-client';

export const useStreamVideoClient = (
  baseUrl: string,
  apiKey: string,
  token: string,
  user: UserRequest,
): [StreamVideoClient | undefined, Error | undefined] => {
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  const [error, setError] = useState<Error | undefined>();
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
          setError(undefined);
        }
      })
      .catch((err) => {
        console.error(`Failed to establish connection`, err);
        setError(err);
      });

    return () => {
      didInterruptConnect = true;
      connection.then(() => {
        client
          .disconnect()
          .then(() => {
            setClient(undefined);
            setError(undefined);
          })
          .catch((err) => {
            console.error(`Failed to disconnect`, err);
            setError(err);
          });
      });
    };
  }, [apiKey, baseUrl, token, user]);

  return [client, error];
};
