import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import { useIncomingCalls } from '@stream-io/video-react-bindings';
import { UserInfoView } from './UserInfoView';
import {
  useCallCycleContext,
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts';
import { useRingCall } from '../hooks/useRingCall';
import { Phone, PhoneDown, Video, VideoSlash } from '../icons';
import { theme } from '../theme';
export const IncomingCallView = () => {
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();
  const { answerCall, rejectCall } = useRingCall();
  const { callCycleHandlers } = useCallCycleContext();
  const { onRejectCall } = callCycleHandlers;

  const videoToggle = async () => {
    setState((prevState) => ({
      isVideoMuted: !prevState.isVideoMuted,
    }));
  };

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
          onPress={videoToggle}
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
  // FIXME OL: this needs to be reworked
  const [incomingCall] = useIncomingCalls();

  const memberUserIds = Object.keys(incomingCall?.users || {});

  if (memberUserIds.length)
    return (
      <ImageBackground
        blurRadius={10}
        source={{
          //FIXME: This is a temporary solution to get a random image for the background. Replace with image from coordinator
          uri: `https://getstream.io/random_png/?id=${memberUserIds[0]}&name=${memberUserIds[0]}`,
        }}
        style={StyleSheet.absoluteFill}
      >
        {children}
      </ImageBackground>
    );
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
    textAlign: 'center',
    color: theme.light.static_white,
    ...theme.fonts.heading6,
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
