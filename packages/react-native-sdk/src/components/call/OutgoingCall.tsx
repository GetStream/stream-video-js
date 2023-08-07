import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfo } from './internal/UserInfo';
import { CallControlsButton } from '../utility/internal/CallControlsButton';
import { Mic, MicOff, Video, VideoSlash } from '../../icons';
import { VideoRenderer } from '../utility/internal/VideoRenderer';
import { useLocalVideoStream } from '../../hooks/useLocalVideoStream';
import { theme } from '../../theme';
import { Z_INDEX } from '../../constants';
import { useMediaStreamManagement } from '../../providers/MediaStreamManagement';
import {
  HangUpCallButton,
  HangUpCallButtonType,
} from '../utility/internal/HangupCallButton';
import { useI18n } from '@stream-io/video-react-bindings';

/**
 * Props for the OutgoingCall Component.
 */
export type OutgoingCallType = {
  /**
   * HangUp Call Button Props to be passed as an object
   */
  hangupCallButton?: HangUpCallButtonType;
};

/**
 * An outgoing call with the callee's avatar, name, caller's camera in background, reject and mute buttons.
 * Used after the user has initiated a call.
 */
export const OutgoingCall = ({ hangupCallButton }: OutgoingCallType) => {
  const {
    initialAudioEnabled,
    initialVideoEnabled,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
  } = useMediaStreamManagement();
  const { t } = useI18n();
  const muteStatusColor = (status: boolean) => {
    return status ? theme.light.overlay_dark : theme.light.static_white;
  };

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <View style={styles.content}>
          <UserInfo />
          <Text style={styles.callingText}>{t('Calling...')}</Text>
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
          <HangUpCallButton
            onPressHandler={hangupCallButton?.onPressHandler}
            style={[styles.cancelCallButton, theme.button.lg]}
          />
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
  cancelCallButton: {
    alignSelf: 'center',
  },
  button: {},
  svgContainerStyle: {},
});
