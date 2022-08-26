import { StreamVideoClient } from '@stream-io/video-client';
import { UserInput } from '@stream-io/video-client/src/gen/video/coordinator/user_v1/user';
import { useEffect, useState } from 'react';

export const useCreateStreamVideoClient = (
  baseUrl: string,
  apiKey: string,
  token: string,
  user: UserInput,
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
      .connect(apiKey, token, user)
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
