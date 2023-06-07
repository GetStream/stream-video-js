import {ActivityIndicator, Platform, StyleSheet, View} from 'react-native';
import React, {useEffect} from 'react';
import {
  CallControlsView,
  StreamCall,
  StreamVideo,
  useCall,
  useCreateStreamVideoClient,
  usePublishMediaStreams,
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
    tokenOrProvider: USER.custom.token,
    apiKey: STREAM_API_KEY,
    options: {
      preferredVideoCodec: Platform.OS === 'android' ? 'VP8' : undefined,
    },
  });
  const handleOnCallHungUp = () => navigation.navigate('WelcomeScreen');

  return (
    <StreamVideo client={videoClient}>
      <StreamCall
        callId={generateCallId()}
        callType="default"
        callCycleHandlers={{onCallHungUp: handleOnCallHungUp}}>
        <MyActiveCall />
      </StreamCall>
    </StreamVideo>
  );
};

const MyActiveCall = () => {
  const call = useCall();
  const insets = useSafeAreaInsets();
  usePublishMediaStreams();

  useEffect(() => {
    if (!call) {
      return;
    }
    const startCall = async () => {
      try {
        // Join the call.
        await call.join({create: true});

        // Start InCallManager and enable the speakerphone.
        InCallManager.start({media: 'video'});
        InCallManager.setForceSpeakerphoneOn(true);
      } catch (e) {
        console.log('Error joining call', e);
      }
    };
    startCall();
  }, [call]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <View style={[styles.wrapper, {paddingTop: insets.top}]}>
      <IntroModal callId={call.id} />
      <MyCallParticipantsView />
      <CallControlsView />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#272A30',
  },
});
