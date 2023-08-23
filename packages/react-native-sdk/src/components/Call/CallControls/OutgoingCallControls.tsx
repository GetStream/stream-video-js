import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { HangUpCallButton } from './HangupCallButton';
import { ToggleAudioPreviewButton } from './ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './ToggleVideoPreviewButton';

/**
 * Props for the OutgoingCallControls Component.
 */
export type OutgoingCallControlsProps = {
  /**
   * Handler to be executed when the outgoing call is cancelled or hanged up.
   */
  onHangupCallHandler?: () => void;
};

export const OutgoingCallControls = ({
  onHangupCallHandler,
}: OutgoingCallControlsProps) => {
  const {
    theme: { outgoingCall },
  } = useTheme();
  return (
    <View style={[styles.buttonGroup, outgoingCall.buttonGroup]}>
      <View
        style={[styles.deviceControlButtons, outgoingCall.deviceControlButtons]}
      >
        <ToggleAudioPreviewButton />
        <ToggleVideoPreviewButton />
      </View>
      <HangUpCallButton onPressHandler={onHangupCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonGroup: {
    alignItems: 'center',
  },
  deviceControlButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
