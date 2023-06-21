import { useEffect, useState } from 'react';
import {
  ChildrenOnly,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useUserContext } from './UserContext';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const VideoClientProvider = ({ children }: ChildrenOnly) => {
  const { user, tokenProvider } = useUserContext();
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    if (!user) return;
    setClient(
      new StreamVideoClient({
        apiKey,
        tokenProvider,
        user: {
          id: user.id,
          image: user.imageUrl,
          name: user.name,
        },
      }),
    );
  }, [tokenProvider, user]);

  if (!client) return null;

  return <StreamVideo client={client}>{children}</StreamVideo>;
};
