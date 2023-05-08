import {
  Chat,
  OverlayProvider,
  Streami18n,
  useChatContext,
} from 'stream-chat-react-native';
import React, {PropsWithChildren, useCallback, useMemo, useState} from 'react';
import {
  StreamVideoCall,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {v4 as uuidv4} from 'uuid';

console.log('STREAM_API_KEY', STREAM_API_KEY);

export const VideoWrapper = ({children}: PropsWithChildren<{}>) => {
  const setRandomCallId = () => SetCallId(uuidv4().toLowerCase());
  const {client} = useChatContext<StreamChatGenerics>();
  const {channel} = useAppContext();
  const [callId, SetCallId] = useState<string>(uuidv4().toLowerCase());
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

  const videoClient = useCreateStreamVideoClient({
    user,
    tokenOrProvider: token,
    apiKey: STREAM_API_KEY,
  });
  const navigation =
    useNavigation<NativeStackNavigationProp<NavigationStackParamsList>>();

  const onCallJoined = useCallback(() => {
    navigation.navigate('ActiveCallScreen');
  }, [navigation]);

  const onCallIncoming = useCallback(() => {
    navigation.navigate('IncomingCallScreen');
  }, [navigation]);

  const onCallOutgoing = useCallback(() => {
    navigation.navigate('OutgoingCallScreen');
  }, [navigation]);

  const onCallHungUp = useCallback(() => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
    setRandomCallId();
  }, [channel, navigation]);

  const onCallRejected = useCallback(() => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
    setRandomCallId();
  }, [navigation, channel]);

  const callCycleHandlers = useMemo(() => {
    return {
      onCallJoined,
      onCallIncoming,
      onCallOutgoing,
      onCallHungUp,
      onCallRejected,
    };
  }, [
    onCallJoined,
    onCallIncoming,
    onCallOutgoing,
    onCallHungUp,
    onCallRejected,
  ]);

  if (!videoClient) {
    return <AuthProgressLoader />;
  }

  return (
    <StreamVideoCall
      callId={callId}
      client={videoClient}
      callCycleHandlers={callCycleHandlers}>
      {children}
    </StreamVideoCall>
  );
};

const streami18n = new Streami18n({
  language: 'en',
});

export const MessengerWrapper = ({children}: PropsWithChildren<{}>) => {
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
        <VideoWrapper>{children}</VideoWrapper>
      </Chat>
    </OverlayProvider>
  );
};
