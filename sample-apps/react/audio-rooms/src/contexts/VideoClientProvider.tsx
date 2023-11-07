import { PropsWithChildren, useEffect, useState } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useUserContext } from './UserContext';

export const VideoClientProvider = ({ children }: PropsWithChildren) => {
  const { apiKey, user, tokenProvider, token } = useUserContext();
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    if (!apiKey) {
      throw new Error('Missing API key');
    }

    if (!user) return;
    const _client = new StreamVideoClient({
      apiKey,
      tokenProvider,
      token,
      user: {
        id: user.id,
        image: user.imageUrl,
        name: user.name,
      },
    });
    setClient(_client);

    return () => {
      _client
        ?.disconnectUser()
        .catch((error) => console.log(`Couldn't disconnect user`, error));
      setClient(undefined);
    };
  }, [apiKey, token, tokenProvider, user]);

  if (!client) return null;

  return <StreamVideo client={client}>{children}</StreamVideo>;
};
