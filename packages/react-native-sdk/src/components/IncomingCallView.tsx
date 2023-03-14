import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import {
  useConnectedUser,
  useIncomingCalls,
} from '@stream-io/video-react-bindings';
import { UserInfoView } from './UserInfoView';
import { useCallCycleContext } from '../contexts';
import { useRingCall } from '../hooks/useRingCall';
import { Phone, PhoneDown, Video, VideoSlash } from '../icons';
import { getMembersForIncomingCall } from '../utils';
import { useMutingState } from '../hooks';

export const IncomingCallView = () => {
  const { isVideoMuted, toggleVideoState } = useMutingState();
  const { answerCall, rejectCall } = useRingCall();
  const { callCycleHandlers } = useCallCycleContext();
  const { onRejectCall } = callCycleHandlers;

  const answerCallHandler = async () => {
    await answerCall();
  };

  const rejectCallHandler = async () => {
    await rejectCall();
    if (onRejectCall) onRejectCall();
  };

  return (
    <Background>
      <UserInfoView />
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <CallControlsButton
          onPress={rejectCallHandler}
          colorKey={'cancel'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          <PhoneDown color="#ffffff" />
        </CallControlsButton>
        <CallControlsButton
          onPress={toggleVideoState}
          colorKey={!isVideoMuted ? 'activated' : 'deactivated'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          {isVideoMuted ? (
            <VideoSlash color="#ffffff" />
          ) : (
            <Video color="#000000" />
          )}
        </CallControlsButton>
        <CallControlsButton
          onPress={answerCallHandler}
          colorKey={'callToAction'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          <Phone color="#ffffff" />
        </CallControlsButton>
      </View>
    </Background>
  );
};

const Background: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [incomingCall] = useIncomingCalls();
  const connectedUser = useConnectedUser();
  // FIXME OL: this needs to be reworked
  const members = getMembersForIncomingCall(incomingCall, connectedUser);

  if (members.length) {
    return (
      <ImageBackground
        blurRadius={10}
        source={{
          uri: members[0].image,
        }}
        style={StyleSheet.absoluteFill}
      >
        {children}
      </ImageBackground>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]}>{children}</View>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#272A30',
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
  svgStyle: {
    height: 30,
    width: 30,
  },
});
