import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { STREAM_API_KEY } from 'react-native-dotenv';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import translations from '../translations';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);

  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!username || !userImageUrl) {
      return;
    }
    const user = {
      id: username,
      name: username,
      imageUrl: userImageUrl,
    };
    const _videoClient = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      user,
      tokenProvider: async () => createToken({ user_id: user.id }),
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient.disconnectUser();
      setVideoClient(undefined);
    };
  }, [username, userImageUrl]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo client={videoClient} translationsOverrides={translations}>
      {children}
    </StreamVideo>
  );
};
