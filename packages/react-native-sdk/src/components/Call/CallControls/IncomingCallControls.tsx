import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { AcceptCallButton } from './AcceptCallButton';
import { RejectCallButton } from './RejectCallButton';

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
  const {
    theme: {
      incomingCall,
      variants: { buttonSizes },
    },
  } = useTheme();
  return (
    <View style={[styles.buttonGroup, incomingCall.buttonGroup]}>
      <RejectCallButton
        onPressHandler={onRejectCallHandler}
        size={buttonSizes.md}
        rejectReason="decline"
      />
      <AcceptCallButton onPressHandler={onAcceptCallHandler} />
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
