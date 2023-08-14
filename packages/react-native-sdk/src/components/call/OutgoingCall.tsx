import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfo } from './internal/UserInfo';
import { useLocalVideoStream } from '../../hooks/useLocalVideoStream';
import { theme } from '../../theme';
import { Z_INDEX } from '../../constants';
import { useMediaStreamManagement } from '../../providers/MediaStreamManagement';
import {
  HangUpCallButton,
  HangUpCallButtonProps,
} from './CallControls/HangupCallButton';
import { useI18n } from '@stream-io/video-react-bindings';
import { RTCView } from 'react-native-webrtc';
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
        <View>
          <UserInfo />
          <Text style={styles.callingText}>{t('Calling...')}</Text>
        </View>
        <View style={styles.buttonGroup}>
          <View style={styles.deviceControlButtons}>
            <ToggleAudioPreviewButton />
            <ToggleVideoPreviewButton />
          </View>
          <HangUpCallButton onPressHandler={hangupCallButton?.onPressHandler} />
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
      <RTCView
        streamURL={localVideoStream?.toURL()}
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
});
