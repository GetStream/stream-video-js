import React, { PropsWithChildren } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import ButtonContainer from '../components/CallControls/ButtonContainer';

import Phone from '../icons/Phone';
import PhoneDown from '../icons/PhoneDown';
import { useRingCall } from '../hooks/useRingCall';
import { useStore } from '../hooks/useStore';
import { useObservableValue } from '../hooks/useObservable';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import { UserInfoView } from '../components/UserInfoView';

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  background: {
    backgroundColor: 'black',
    opacity: 0.9,
  },
  incomingCallText: {
    marginTop: 16,
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: '40%',
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
  buttonStyle: {
    height: 70,
    width: 70,
    borderRadius: 70,
  },
  svg: {
    height: 30,
    width: 30,
  },
});

const Background = ({
  children,
  memberUserIds,
}: PropsWithChildren<{ memberUserIds: string[] }>) => {
  return memberUserIds.length === 1 ? (
    <ImageBackground
      blurRadius={10}
      source={{
        uri: `https://getstream.io/random_png/?id=${memberUserIds[0]}&name=${memberUserIds[0]}`,
      }}
      style={styles.container}
    >
      {children}
    </ImageBackground>
  ) : (
    <View style={[styles.container, styles.background]}>{children}</View>
  );
};

const IncomingCallScreen = () => {
  const { incomingRingCalls$, activeRingCallDetails$ } = useStore();
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const activeRingCallDetails = useObservableValue(activeRingCallDetails$);
  const { answerCall, rejectCall } = useRingCall();
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const setState = useAppGlobalStoreSetState();

  const members = activeRingCallDetails?.members || {};
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];

  if (incomingRingCalls.length === 0) {
    return null;
  }

  const videoToggle = () => {
    setState((prevState) => ({
      isVideoMuted: !prevState.isVideoMuted,
    }));
  };

  return (
    <Background memberUserIds={memberUserIds}>
      <UserInfoView memberUserIds={memberUserIds} members={members} />
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <ButtonContainer
          onPress={rejectCall}
          colorKey={'cancel'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svg}
        >
          <PhoneDown color="#fff" />
        </ButtonContainer>
        <ButtonContainer
          onPress={videoToggle}
          colorKey={isVideoMuted ? 'activated' : 'deactivated'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svg}
        >
          {isVideoMuted ? (
            <Video color="black" />
          ) : (
            <VideoSlash color="white" />
          )}
        </ButtonContainer>
        <ButtonContainer
          onPress={answerCall}
          colorKey={'callToAction'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svg}
        >
          <Phone color="#fff" />
        </ButtonContainer>
      </View>
    </Background>
  );
};

export default IncomingCallScreen;
