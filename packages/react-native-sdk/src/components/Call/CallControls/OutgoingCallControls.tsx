import React from 'react';
import { StyleSheet, View } from 'react-native';
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
  return (
    <View style={styles.buttonGroup}>
      <View style={styles.deviceControlButtons}>
        <ToggleAudioPreviewButton />
        <ToggleVideoPreviewButton />
      </View>
      <HangUpCallButton onHangupCallHandler={onHangupCallHandler} />
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
