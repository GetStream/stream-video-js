import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfoView } from './UserInfoView';
import { CallControlsButton } from './CallControlsButton';
import { Mic, MicOff, PhoneDown, Video, VideoSlash } from '../icons';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import { VideoRenderer } from './VideoRenderer';
import { useMutingState } from '../hooks/useMutingState';
import { useLocalVideoStream } from '../hooks/useLocalVideoStream';
import { theme } from '../theme';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { Z_INDEX } from '../constants';

export const OutgoingCallView = () => {
  const { isAudioMuted, isVideoMuted, toggleAudioState, toggleVideoState } =
    useMutingState();
  const call = useCall();
  const callingState = useCallCallingState();

  const hangupCallHandler = async () => {
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave();
    } catch (error) {
      console.log('Error leaving Call', error);
    }
  };
  const muteStatusColor = (status: boolean) => {
    return status ? theme.light.overlay_dark : theme.light.static_white;
  };

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
              color={muteStatusColor(isAudioMuted)}
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
              color={muteStatusColor(isVideoMuted)}
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

  if (isVideoMuted || !localVideoStream) {
    return <View style={styles.background} />;
  }
  return (
    <View style={styles.background}>
      <VideoRenderer
        mediaStream={localVideoStream}
        zOrder={Z_INDEX.IN_BACK}
        style={StyleSheet.absoluteFill}
        mirror
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: Z_INDEX.IN_MIDDLE,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 2 * theme.margin.xl,
  },
  background: {
    backgroundColor: theme.light.static_grey,
    flex: 1,
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
});
