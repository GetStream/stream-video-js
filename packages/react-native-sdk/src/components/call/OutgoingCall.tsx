import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfo } from './internal/UserInfo';
import { VideoRenderer } from '../utility/internal/VideoRenderer';
import { useLocalVideoStream } from '../../hooks/useLocalVideoStream';
import { theme } from '../../theme';
import { Z_INDEX } from '../../constants';
import {
  HangUpCallButton,
  HangUpCallButtonProps,
} from './CallControls/HangupCallButton';
import { useCameraState, useI18n } from '@stream-io/video-react-bindings';
import { ToggleAudioPreviewButton } from './CallControls/ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './CallControls/ToggleVideoPreviewButton';

/**
 * Props for the OutgoingCall Component.
 */
export type OutgoingCallProps = {
  /**
   * HangUp Call Button Props to be passed as an object
   */
  hangupCallButton?: HangUpCallButtonProps;
};

/**
 * An outgoing call with the callee's avatar, name, caller's camera in background, reject and mute buttons.
 * Used after the user has initiated a call.
 */
export const OutgoingCall = ({ hangupCallButton }: OutgoingCallProps) => {
  const { t } = useI18n();

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <View style={styles.content}>
          <UserInfo />
          <Text style={styles.callingText}>{t('Calling...')}</Text>
        </View>
        <View style={styles.buttonGroup}>
          <View style={styles.deviceControlButtons}>
            <ToggleAudioPreviewButton />
            <ToggleVideoPreviewButton />
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
  const { status } = useCameraState();

  if (status === 'disabled' || !localVideoStream) {
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
});
