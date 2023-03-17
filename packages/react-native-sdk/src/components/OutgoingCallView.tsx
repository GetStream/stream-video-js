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
        <View style={styles.content}>
          <UserInfoView />
          <Text style={styles.callingText}>Calling...</Text>
        </View>
        <View style={styles.buttonGroup}>
          <View style={styles.deviceControlButtons}>
            <CallControlsButton
              onPress={toggleAudioState}
              color={
                isAudioMuted
                  ? theme.light.overlay_dark
                  : theme.light.static_white
              }
              style={[styles.button, theme.button.lg]}
              svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
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
              style={[styles.button, theme.button.lg]}
              svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
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
            style={[styles.button, styles.hangupButton, theme.button.lg]}
            svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
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
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 2 * theme.margin.xl,
  },
  background: {
    backgroundColor: theme.light.static_grey,
  },
  content: {},
  callingText: {
    marginTop: theme.margin.md,
    textAlign: 'center',
    color: theme.light.static_white,
    ...theme.fonts.heading6,
  },
  buttonGroup: {},
  deviceControlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.margin.md,
  },
  hangupButton: {
    alignSelf: 'center',
  },
  button: {},
  svgContainerStyle: {},
  stream: {
    flex: 1,
  },
});
