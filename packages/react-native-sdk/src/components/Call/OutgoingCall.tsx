import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfo } from './UserInfo';
import { useLocalVideoStream } from '../../hooks/useLocalVideoStream';
import { Z_INDEX } from '../../constants';
import {
  HangUpCallButton,
  HangUpCallButtonProps,
} from './CallControls/HangupCallButton';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { RTCView } from '@stream-io/react-native-webrtc';
import { ToggleAudioPreviewButton } from './CallControls/ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './CallControls/ToggleVideoPreviewButton';
import { useTheme } from '../../contexts/ThemeContext';

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
  const {
    theme: { colors, typefaces, outgoingCall },
  } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          outgoingCall.container,
        ]}
      >
        <View>
          <UserInfo />
          <Text
            style={[
              styles.callingText,
              { color: colors.static_white },
              typefaces.heading6,
              outgoingCall.callingText,
            ]}
          >
            {t('Calling...')}
          </Text>
        </View>
        <View style={[styles.buttonGroup, outgoingCall.buttonGroup]}>
          <View
            style={[
              styles.deviceControlButtons,
              outgoingCall.deviceControlButtons,
            ]}
          >
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
  const {
    theme: { colors, outgoingCall },
  } = useTheme();

  const localVideoStream = useLocalVideoStream();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();

  if (status === 'disabled' || !localVideoStream) {
    return <View style={styles.background} />;
  }
  return (
    <View
      style={[
        styles.background,
        { backgroundColor: colors.static_grey },
        outgoingCall.background,
      ]}
    >
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
    paddingVertical: 64,
  },
  background: {
    flex: 1,
  },
  callingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    alignItems: 'center',
  },
  deviceControlButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
