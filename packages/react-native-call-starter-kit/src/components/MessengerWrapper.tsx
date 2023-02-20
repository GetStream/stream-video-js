import {
  Chat,
  OverlayProvider,
  Streami18n,
  useChatContext,
} from 'stream-chat-react-native';
import React, {PropsWithChildren, useCallback, useMemo} from 'react';
import {useVideoClient} from '../hooks/useVideoClient';
import {StreamCall, StreamVideo} from '@stream-io/video-react-native-sdk';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {userFromToken} from '../utils/userFromToken';
import {useChatClient} from '../hooks/useChatClient';
import {useStreamChatTheme} from '../../useStreamChatTheme';
import {AuthProgressLoader} from './AuthProgressLoader';
import type {
  NavigationStackParamsList,
  StreamChatGenerics,
  VideoProps,
} from '../types';
import {STREAM_API_KEY} from 'react-native-dotenv';
import {useAppContext} from '../context/AppContext';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

export const VideoWrapper = ({
  children,
  navigation,
}: PropsWithChildren<{
  navigation: NativeStackNavigationProp<NavigationStackParamsList>;
}>) => {
  const {client} = useChatContext<StreamChatGenerics>();
  const {channel} = useAppContext();
  const token = client._getToken() || '';

  const user = useMemo<VideoProps['user']>(
    () => ({
      id: client.user?.id as string,
      name: client.user?.name as string,
      imageUrl: client.user?.image as string,
      token: token,
    }),
    [client.user, token],
  );

  const {videoClient} = useVideoClient({user, token});

  const activeCallHandler = useCallback(() => {
    navigation.navigate('ActiveCallScreen');
  }, [navigation]);

  const outgoingCallHandler = useCallback(() => {
    navigation.navigate('OutgoingCallScreen');
  }, [navigation]);

  const incomingCallHandler = useCallback(() => {
    navigation.navigate('IncomingCallScreen');
  }, [navigation]);

  const onHangupCall = useCallback(() => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
  }, [channel, navigation]);

  if (!videoClient) {
    return <AuthProgressLoader />;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall
        onActiveCall={activeCallHandler}
        onOutgoingCall={outgoingCallHandler}
        onIncomingCall={incomingCallHandler}
        onHangupCall={onHangupCall}>
        {children}
      </StreamCall>
    </StreamVideo>
  );
};

const streami18n = new Streami18n({
  language: 'en',
});

export const MessengerWrapper = ({
  children,
  navigation,
}: PropsWithChildren<{
  navigation: NativeStackNavigationProp<NavigationStackParamsList>;
}>) => {
  const {userToken} = useAppContext();
  const user = useMemo(() => userFromToken(userToken), [userToken]);
  const chatClient = useChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenOrProvider: userToken,
  });
  const {bottom} = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider<StreamChatGenerics>
      bottomInset={bottom}
      i18nInstance={streami18n}
      value={{style: theme}}>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <VideoWrapper navigation={navigation}>{children}</VideoWrapper>
      </Chat>
    </OverlayProvider>
  );
};
