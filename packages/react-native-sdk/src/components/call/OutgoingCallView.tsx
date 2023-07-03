import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfoView } from '../call/internal/UserInfoView';
import { CallControlsButton } from '../utility/internal/CallControlsButton';
import { Mic, MicOff, PhoneDown, Video, VideoSlash } from '../../icons';
import { VideoRenderer } from '../utility/internal/VideoRenderer';
import { useLocalVideoStream } from '../../hooks/useLocalVideoStream';
import { theme } from '../../theme';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { Z_INDEX } from '../../constants';
import { useMediaStreamManagement } from '../../providers/MediaStreamManagement';

/**
 * An outgoing call view with the callee's avatar, name, caller's camera in background, reject and mute buttons.
 * Used after the user has initiated a call.
 */
export const OutgoingCallView = () => {
  const {
    initialAudioEnabled,
    initialVideoEnabled,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
  } = useMediaStreamManagement();
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
  const muteStatusColor = (muted: boolean) => {
    return muted ? theme.light.overlay_dark : theme.light.static_white;
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
              onPress={toggleInitialAudioMuteState}
              color={muteStatusColor(!initialAudioEnabled)}
              style={[styles.button, theme.button.lg]}
              svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
            >
              {!initialAudioEnabled ? (
                <MicOff color={theme.light.static_white} />
              ) : (
                <Mic color={theme.light.static_black} />
              )}
            </CallControlsButton>
            <CallControlsButton
              onPress={toggleInitialVideoMuteState}
              color={muteStatusColor(!initialVideoEnabled)}
              style={[styles.button, theme.button.lg]}
              svgContainerStyle={[styles.svgContainerStyle, theme.icon.lg]}
            >
              {!initialVideoEnabled ? (
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
  const { initialVideoEnabled } = useMediaStreamManagement();

  if (!initialVideoEnabled || !localVideoStream) {
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
