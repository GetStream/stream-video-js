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
import { theme } from '../theme';
import { getMembersForIncomingCall } from '../utils';
import { useMutingState } from '../hooks/useMutingState';

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
          color={theme.light.error}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          <PhoneDown color={theme.light.static_white} />
        </CallControlsButton>
        <CallControlsButton
          onPress={toggleVideoState}
          color={
            !isVideoMuted ? theme.light.static_white : theme.light.overlay_dark
          }
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          {isVideoMuted ? (
            <VideoSlash color={theme.light.static_white} />
          ) : (
            <Video color={theme.light.static_black} />
          )}
        </CallControlsButton>
        <CallControlsButton
          onPress={answerCallHandler}
          color={theme.light.info}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          <Phone color={theme.light.static_white} />
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
  if (!incomingCall) return null;

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
    backgroundColor: theme.light.static_grey,
  },
  incomingCallText: {
    marginTop: 16,
    fontSize: 20,
    textAlign: 'center',
    color: theme.light.static_white,
    fontWeight: '600',
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
