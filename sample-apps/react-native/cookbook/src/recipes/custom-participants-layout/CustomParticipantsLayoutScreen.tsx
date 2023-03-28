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
  StreamCallProvider,
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
import PressMe from '../../components/PressMe';
import MyCallParticipantsView from './MyCallParticipantsView';

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

function IntroModal({callId}: {callId: string}) {
  const [isIntroModalVisible, setIsIntroModalVisible] = useState(true);

  return (
    <Modal
      presentationStyle={'overFullScreen'}
      visible={isIntroModalVisible}
      animationType="slide"
      onRequestClose={() => setIsIntroModalVisible(false)}
      transparent>
      <View style={styles.modalWrapper}>
        <View style={styles.modalContainer}>
          <Text style={{fontSize: 16}}>
            Your call has just started. To check the full implementation, please
            join the call from another device
          </Text>
          <Text style={[styles.margined, {fontWeight: 'bold'}]}>
            Your call ID: {callId}
          </Text>
          <PressMe
            style={styles.margined}
            onPress={() =>
              openURLInBrowser(
                `https://stream-calls-dogfood.vercel.app/join/${callId}`,
              )
            }
            text={
              '🧑‍💻️ Click here to join the call with more participants via a web browser'
            }
          />
          <PressMe
            style={styles.margined}
            onPress={() =>
              openURLInBrowser(
                'https://github.com/GetStream/stream-video-buddy',
              )
            }
            text={'⌨️ Click here to join via Stream Video Buddy CLI'}
          />
          <Pressable
            style={[styles.margined, {alignSelf: 'flex-end'}]}
            onPress={() => setIsIntroModalVisible(false)}>
            <Text>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const Inner = () => {
  const activeCall = useActiveCall();
  const videoClient = useStreamVideoClient();
  const insets = useSafeAreaInsets();
  const callId = useRef<string>(generateCallId());

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
    <StreamCallProvider call={activeCall}>
      <View style={[styles.wrapper, {paddingTop: insets.top}]}>
        <IntroModal callId={callId.current} />
        <MyCallParticipantsView />
      </View>
    </StreamCallProvider>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  modalContainer: {
    justifyContent: 'center',
    padding: 16,
    marginTop: 50,
    marginHorizontal: 16,
    backgroundColor: 'rgba(13,150,236,0.4)',
    borderRadius: 8,
  },
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  margined: {marginTop: 16},
});
