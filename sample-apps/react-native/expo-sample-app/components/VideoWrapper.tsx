import { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    const user = {
      id: 'Kir_Kanos',
      name: 'Kir Kanos',
    };
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiS2lyX0thbm9zIiwiaXNzIjoicHJvbnRvIiwic3ViIjoidXNlci9LaXJfS2Fub3MiLCJpYXQiOjE2OTI1OTI5MjAsImV4cCI6MTY5MzE5NzcyNX0.iKokvnHxYics1atxuljejrqfpTtOpfZNal8ESX-gJX4';
    const _videoClient = new StreamVideoClient({
      apiKey: 'mmhfdzb5evj2',
      user,
      token,
      options: { logLevel: 'warn' },
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient.disconnectUser();
      setVideoClient(undefined);
    };
  }, []);

  if (!videoClient) {
    return null;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
