import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import ButtonContainer from '../components/CallControls/ButtonContainer';

import Phone from '../icons/Phone';
import PhoneDown from '../icons/PhoneDown';
import { useRingCall } from '../hooks/useRingCall';
import { useStore } from '../hooks/useStore';
import { useObservableValue } from '../hooks/useObservable';

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  userInfo: {
    textAlign: 'center',
    alignItems: 'center',
    marginTop: '30%',
  },
  avatar: {
    height: 150,
    width: 150,
    borderRadius: 100,
  },
  name: {
    marginTop: 50,
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  incomingCallText: {
    marginTop: 20,
    fontSize: 20,
    textAlign: 'center',
    color: 'gray',
    fontWeight: '700',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: '40%',
  },
});

const IncomingCallScreen = () => {
  const { incomingRingCalls$ } = useStore();
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const { answerCall, rejectCall } = useRingCall();

  if (incomingRingCalls.length === 0) {
    return null;
  }

  const createdByUserId =
    incomingRingCalls[incomingRingCalls.length - 1].createdByUserId;

  return (
    <ImageBackground
      blurRadius={10}
      source={{
        uri: `https://getstream.io/random_png/?id=${createdByUserId}&name=${createdByUserId}`,
      }}
      style={styles.container}
    >
      <View style={styles.userInfo}>
        <Image
          style={styles.avatar}
          source={{
            uri: `https://getstream.io/random_png/?id=${createdByUserId}&name=${createdByUserId}`,
          }}
        />
        <Text style={styles.name}>{createdByUserId}</Text>
      </View>
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <ButtonContainer onPress={rejectCall} colorKey={'cancel'}>
          <PhoneDown color="#fff" />
        </ButtonContainer>
        <ButtonContainer onPress={answerCall} colorKey={'callToAction'}>
          <Phone color="#fff" />
        </ButtonContainer>
      </View>
    </ImageBackground>
  );
};

export default IncomingCallScreen;
