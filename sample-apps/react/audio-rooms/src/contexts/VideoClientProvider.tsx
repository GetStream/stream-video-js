import { useEffect, useState } from 'react';
import {
  ChildrenOnly,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useUserContext } from './UserContext';
import { ConnectionErrorPanel } from '../components/Error';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const VideoClientProvider = ({ children }: ChildrenOnly) => {
  const { user, tokenProvider } = useUserContext();
  const [client] = useState<StreamVideoClient>(
    () => new StreamVideoClient(apiKey),
  );
  const [connectionError, setConnectionError] = useState<Error | undefined>();

  useEffect(() => {
    if (!user) return;

    client
      .connectUser(
        {
          id: user.id,
          image: user.imageUrl,
          name: user.name,
        },
        tokenProvider,
      )
      .catch((err) => {
        console.error(`Failed to establish connection`, err);
        setConnectionError(err);
      });

    return () => {
      client.disconnectUser().catch((err) => {
        console.error('Failed to disconnect', err);
        setConnectionError(err);
      });
    };
  }, [client, tokenProvider, user]);

  return (
    <StreamVideo client={client}>
      {connectionError ? (
        <ConnectionErrorPanel error={connectionError} />
      ) : (
        children
      )}
    </StreamVideo>
  );
};
