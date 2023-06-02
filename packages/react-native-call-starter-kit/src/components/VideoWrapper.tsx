import React, {PropsWithChildren, useMemo} from 'react';
import {useChatContext} from 'stream-chat-react-native';
import {StreamChatGenerics} from '../types';
import {
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {STREAM_API_KEY} from 'react-native-dotenv';
import {Platform} from 'react-native';

export const VideoWrapper = ({children}: PropsWithChildren<{}>) => {
  const {client} = useChatContext<StreamChatGenerics>();
  const token = client._getToken() || '';

  const user = useMemo(
    () => ({
      id: client.user?.id as string,
      name: client.user?.name as string,
      imageUrl: client.user?.image as string,
    }),
    [client.user],
  );

  const videoClient = useCreateStreamVideoClient({
    user,
    tokenOrProvider: token,
    apiKey: STREAM_API_KEY,
    options: {
      preferredVideoCodec: Platform.OS === 'android' ? 'VP8' : undefined,
    },
  });

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
