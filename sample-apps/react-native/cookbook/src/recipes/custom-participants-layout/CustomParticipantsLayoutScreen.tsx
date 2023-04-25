import {ActivityIndicator, StyleSheet, View} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {
  CallControlsView,
  StreamCallProvider,
  StreamVideo,
  useActiveCall,
  useCallCycleContext,
  useCreateStreamVideoClient,
  usePublishMediaStreams,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  STREAM_API_KEY,
  STREAM_USER_ID,
  STREAM_USER_TOKEN,
} from 'react-native-dotenv';
import {useNavigation} from '@react-navigation/core';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import InCallManager from 'react-native-incall-manager';
import {customAlphabet} from 'nanoid';
import MyCallParticipantsView from './MyCallParticipantsView';
import IntroModal from './IntroModal';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../types';

const USER = {
  id: STREAM_USER_ID,
  name: 'Alice',
  imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
  custom: {
    token: STREAM_USER_TOKEN,
  },
};
console.log('User loaded: ', USER);

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 5);
const generateCallId = () => nanoid(5);
export default () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const videoClient = useCreateStreamVideoClient({
    user: USER,
    tokenOrProvider: USER?.custom?.token,
    apiKey: STREAM_API_KEY,
  });
  const handleOnHangupCall = () => navigation.navigate('WelcomeScreen');

  return (
    <StreamVideo
      client={videoClient}
      callCycleHandlers={{onHangupCall: handleOnHangupCall}}>
      <MyActiveCall />
    </StreamVideo>
  );
};

const MyActiveCall = () => {
  const activeCall = useActiveCall();
  const videoClient = useStreamVideoClient();
  const insets = useSafeAreaInsets();
  const callId = useRef<string>(generateCallId());
  usePublishMediaStreams();
  const {callCycleHandlers} = useCallCycleContext();
  const {onHangupCall} = callCycleHandlers;

  useEffect(() => {
    const startCall = async () => {
      try {
        // Join the call and start the call cycle.
        await videoClient?.call('default', callId.current).join();
        // Start InCallManager and enable the speakerphone.
        InCallManager.start({media: 'video'});
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (e) {
        console.log('Error joining call', e);
      }
    };
    startCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId.current]);

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <StreamCallProvider call={activeCall}>
      <View style={[styles.wrapper, {paddingTop: insets.top}]}>
        <IntroModal callId={callId.current} />
        <MyCallParticipantsView />
        <CallControlsView onHangupCall={onHangupCall} />
      </View>
    </StreamCallProvider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#272A30',
  },
});
