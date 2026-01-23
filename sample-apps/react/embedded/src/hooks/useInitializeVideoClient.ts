import { useEffect, useState } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-react-sdk';

export type UseInitializeVideoClientProps = {
  apiKey?: string;
  userType: string;
  userId?: string;
  userName?: string;
  userImage?: string;
  token?: string;
};

export const useInitializeVideoClient = ({
  apiKey,
  userType,
  userId,
  userName,
  userImage,
  token,
}: UseInitializeVideoClientProps): StreamVideoClient | undefined => {
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    if (!apiKey) return;

    const user: User = createUser(userType, userId, userName, userImage);

    const initClient = async () => {
      const _client = new StreamVideoClient({ apiKey });

      await _client.connectUser(user, token);

      setClient(_client);
    };

    initClient().catch((error) => {
      console.error('Failed to connect user', error);
    });

    return () => {
      setClient((currentClient) => {
        currentClient
          ?.disconnectUser()
          .catch((error) => console.error(`Couldn't disconnect user`, error));
        return undefined;
      });
    };
  }, [apiKey, userType, userId, userName, userImage, token]);

  return client;
};

const createUser = (
  userType: string,
  userId?: string,
  userName?: string,
  userImage?: string,
): User => {
  switch (userType) {
    case 'authenticated':
      return { id: userId!, name: userName, image: userImage };
    case 'guest':
      return { type: 'guest', id: userId!, name: userName, image: userImage };
    case 'anonymous':
      return { type: 'anonymous', name: userName, image: userImage };
    default: {
      throw new Error(`Unknown user type: ${userType}`);
    }
  }
};
