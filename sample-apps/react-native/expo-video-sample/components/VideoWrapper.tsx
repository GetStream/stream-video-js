import React from 'react';
import { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useAppContext } from '../context/AppContext';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { user } = useAppContext();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    const _videoClient = new StreamVideoClient({
      apiKey: 'hd8szvscpxvd',
      user,
      tokenProvider: user?.custom?.token,
      options: { logLevel: 'warn' },
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient.disconnectUser();
      setVideoClient(undefined);
    };
  }, [user]);

  if (!videoClient) {
    return null;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
