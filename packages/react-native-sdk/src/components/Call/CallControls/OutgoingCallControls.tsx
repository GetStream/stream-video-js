import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { ToggleAudioPreviewButton } from './ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './ToggleVideoPreviewButton';
import { RejectCallButton } from './RejectCallButton';

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
    theme: {
      outgoingCall,
      variants: { buttonSizes },
    },
  } = useTheme();
  return (
    <View style={[styles.buttonGroup, outgoingCall.buttonGroup]}>
      <View
        style={[styles.deviceControlButtons, outgoingCall.deviceControlButtons]}
      >
        <ToggleAudioPreviewButton />
        <ToggleVideoPreviewButton />
      </View>
      <RejectCallButton
        onPressHandler={onHangupCallHandler}
        size={buttonSizes.md}
        rejectReason="cancel"
      />
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
