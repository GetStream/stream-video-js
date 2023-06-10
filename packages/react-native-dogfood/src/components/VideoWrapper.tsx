import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import {
  StreamVideo,
  useCreateStreamVideoClient,
  usePushRegisterEffect,
} from '@stream-io/video-react-native-sdk';
import { STREAM_API_KEY } from 'react-native-dotenv';
import { Platform } from 'react-native';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import translations from '../translations';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);

  const user = useMemo(
    () => ({
      id: username,
      name: username,
      imageUrl: userImageUrl,
    }),
    [username, userImageUrl],
  );

  const tokenOrProvider = useCallback(async () => {
    const token = await createToken({ user_id: username });
    return token;
  }, [username]);

  const videoClient = useCreateStreamVideoClient({
    user,
    tokenOrProvider: tokenOrProvider,
    apiKey: STREAM_API_KEY,
    options: {
      preferredVideoCodec: Platform.OS === 'android' ? 'VP8' : undefined,
    },
  });

  usePushRegisterEffect(videoClient);

  return (
    <StreamVideo client={videoClient} translationsOverrides={translations}>
      {children}
    </StreamVideo>
  );
};
