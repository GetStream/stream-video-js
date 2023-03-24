import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
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

const USER = {
  id: STREAM_USER_ID,
  name: 'Alice',
  imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
  custom: {
    token: STREAM_USER_TOKEN,
  },
};
console.log('User loaded: ', USER);

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
      <Inner />
    </StreamVideo>
  );
};

const Inner = () => {
  const activeCall = useActiveCall();
  const videoClient = useStreamVideoClient();
  const insets = useSafeAreaInsets();
  const CALL_ID = 'test-call-id';
  const onOpenCallParticipantsInfoViewHandler = () => null;

  useEffect(() => {
    videoClient
      ?.joinCall(CALL_ID, 'default')
      .then(() => {
        InCallManager.start({media: 'video'});
        InCallManager.setForceSpeakerphoneOn(true);
      })
      .catch(err => {
        console.log('Error joining call', err);
      });
  }, []);

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <View style={[styles.wrapper, {paddingTop: insets.top}]}>
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
