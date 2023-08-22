import { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useAppContext } from '../context/AppContext';
import { STREAM_API_KEY } from 'react-native-dotenv';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { user } = useAppContext();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );
  const apiKey = STREAM_API_KEY;

  useEffect(() => {
    const _videoClient = new StreamVideoClient({
      apiKey,
      user,
      token: user?.custom?.token,
      options: { logLevel: 'warn' },
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient.disconnectUser();
      setVideoClient(undefined);
    };
  }, [user, apiKey]);

  if (!videoClient) {
    return null;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
