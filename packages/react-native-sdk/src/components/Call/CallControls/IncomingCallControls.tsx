import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AcceptCallButton } from './AcceptCallButton';
import { RejectCallButton } from './RejectCallButton';
import { ToggleVideoPreviewButton } from './ToggleVideoPreviewButton';

/**
 * Props for the IncomingCallControls Component.
 */
export type IncomingCallControlsProps = {
  /**
   * Handler to be executed when an incoming call is accepted
   */
  onAcceptCallHandler?: () => void;
  /**
   * Handler to be executed when an incoming call is rejected
   */
  onRejectCallHandler?: () => void;
};

export const IncomingCallControls = ({
  onAcceptCallHandler,
  onRejectCallHandler,
}: IncomingCallControlsProps) => {
  return (
    <View style={styles.buttonGroup}>
      <RejectCallButton onRejectCallHandler={onRejectCallHandler} />
      <ToggleVideoPreviewButton />
      <AcceptCallButton onAcceptCallHandler={onAcceptCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
});
