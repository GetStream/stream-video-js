import { useEffect, useState } from 'react';
import {
  ChildrenOnly,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useUserContext } from './UserContext';

export const VideoClientProvider = ({ children }: ChildrenOnly) => {
  const { apiKey, user, tokenProvider, token } = useUserContext();
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    if (!apiKey) {
      throw new Error('Missing API key');
    }

    if (!user) return;
    setClient(
      new StreamVideoClient({
        apiKey,
        tokenProvider,
        token,
        user: {
          id: user.id,
          image: user.imageUrl,
          name: user.name,
        },
      }),
    );
  }, [apiKey, token, tokenProvider, user]);

  if (!client) return null;

  return <StreamVideo client={client}>{children}</StreamVideo>;
};
