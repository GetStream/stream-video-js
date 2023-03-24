import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActiveCall,
  StreamVideo,
  useActiveCall,
  useCreateStreamVideoClient,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  STREAM_API_KEY,
  STREAM_USER_ID,
  STREAM_USER_TOKEN,
} from 'react-native-dotenv';
import {useNavigation} from '@react-navigation/core';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '@stream-io/video-react-native-sdk/dist/src/theme';
import InCallManager from 'react-native-incall-manager';
// @ts-ignore
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';
import {customAlphabet} from 'nanoid';

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
  const navigation = useNavigation();
  const videoClient = useCreateStreamVideoClient({
    user: USER,
    tokenOrProvider: USER?.custom?.token,
    apiKey: STREAM_API_KEY,
  });

  return (
    <StreamVideo
      client={videoClient}
      callCycleHandlers={{
        onActiveCall: () => null,
        onHangupCall: () => navigation.navigate('WelcomeScreen'),
      }}>
      <>
        <Inner />
      </>
    </StreamVideo>
  );
};

const Inner = () => {
  const activeCall = useActiveCall();
  const videoClient = useStreamVideoClient();
  const insets = useSafeAreaInsets();
  const callId = useRef<string>(generateCallId());
  const [isIntroModalVisible, setIsIntroModalVisible] = useState(true);
  const onOpenCallParticipantsInfoViewHandler = () => null;

  useEffect(() => {
    videoClient
      ?.joinCall(callId.current, 'default')
      .then(() => {
        InCallManager.start({media: 'video'});
        InCallManager.setForceSpeakerphoneOn(true);
      })
      .catch(err => {
        console.log('Error joining call', err);
      });
  }, [callId.current]);

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <View style={[styles.wrapper, {paddingTop: insets.top}]}>
      <Modal
        presentationStyle={'overFullScreen'}
        visible={isIntroModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsIntroModalVisible(false);
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: 36,
              marginTop: 50,
              marginVertical: 36,
              backgroundColor: 'rgba(255,0,0,0.2)',
            }}>
            <Text>
              The call has just started, to check the full implementation join
              the call from another device
            </Text>
            <Text>Call ID: {callId.current}</Text>
            <Pressable
              style={{}}
              onPress={() =>
                openURLInBrowser(
                  `https://stream-calls-dogfood.vercel.app/join/${callId.current}`,
                )
              }>
              <Text>
                Click here to join the call with more participants via a web
                browser
              </Text>
            </Pressable>
            <Pressable
              style={{}}
              onPress={() =>
                openURLInBrowser(
                  'https://github.com/GetStream/stream-video-buddy',
                )
              }>
              <Text>Click here to join via Stream Video Buddy CLI</Text>
            </Pressable>
            <Pressable onPress={() => setIsIntroModalVisible(false)}>
              <Text>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ActiveCall
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
});
