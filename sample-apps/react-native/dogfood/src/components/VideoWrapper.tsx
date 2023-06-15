import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react';
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

  const user = useMemo(
    () => ({
      id: username,
      name: username,
      imageUrl: userImageUrl,
    }),
    [username, userImageUrl],
  );

  const tokenProvider = useCallback(async () => {
    const token = await createToken({ user_id: username });
    return token;
  }, [username]);

  const [videoClient] = useState<StreamVideoClient>(
    () =>
      new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user,
        tokenProvider,
      }),
  );

  return (
    <StreamVideo client={videoClient} translationsOverrides={translations}>
      {children}
    </StreamVideo>
  );
};
