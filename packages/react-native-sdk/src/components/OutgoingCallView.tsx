import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfoView } from './UserInfoView';
import { CallControlsButton } from './CallControlsButton';
import { Mic, MicOff, PhoneDown, Video, VideoSlash } from '../icons';
import { useRingCall } from '../hooks/useRingCall';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import { VideoRenderer } from './VideoRenderer';
import { useMutingState } from '../hooks/useMutingState';
import { useLocalVideoStream } from '../hooks/useLocalVideoStream';
import { useCallCycleContext } from '../contexts/CallCycleContext';
import { theme } from '../theme';

export const OutgoingCallView = () => {
  const { isAudioMuted, isVideoMuted, toggleAudioState, toggleVideoState } =
    useMutingState();

  const { cancelCall } = useRingCall();
  const { callCycleHandlers } = useCallCycleContext();
  const { onHangupCall } = callCycleHandlers;

  const hangupCallHandler = useCallback(async () => {
    await cancelCall();
    if (onHangupCall) onHangupCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelCall]);

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <UserInfoView />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <View style={styles.deviceControlButtons}>
            <CallControlsButton
              onPress={toggleAudioState}
              color={
                isAudioMuted
                  ? theme.light.overlay_dark
                  : theme.light.static_white
              }
              style={styles.buttonStyle}
              svgContainerStyle={styles.svgStyle}
            >
              {isAudioMuted ? (
                <MicOff color={theme.light.static_white} />
              ) : (
                <Mic color={theme.light.static_black} />
              )}
            </CallControlsButton>
            <CallControlsButton
              onPress={toggleVideoState}
              color={
                isVideoMuted
                  ? theme.light.overlay_dark
                  : theme.light.static_white
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
          </View>

          <CallControlsButton
            onPress={hangupCallHandler}
            color={theme.light.error}
            style={[styles.buttonStyle, styles.hangupButton]}
            svgContainerStyle={styles.svgStyle}
          >
            <PhoneDown color={theme.light.static_white} />
          </CallControlsButton>
        </View>
      </View>
      <Background />
    </>
  );
};

const Background = () => {
  const localVideoStream = useLocalVideoStream();
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);

  if (isVideoMuted || !localVideoStream)
    return <View style={[StyleSheet.absoluteFill, styles.background]} />;
  return (
    <VideoRenderer
      mediaStream={localVideoStream}
      zOrder={1}
      style={styles.stream}
      mirror
    />
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 2,
  },
  background: {
    backgroundColor: theme.light.static_grey,
  },
  callingText: {
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
    color: theme.light.static_white,
    fontWeight: '600',
  },
  buttons: {
    position: 'absolute',
    bottom: 90,
    width: '100%',
  },
  deviceControlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  hangupButton: {
    alignSelf: 'center',
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
  stream: {
    flex: 1,
  },
});
