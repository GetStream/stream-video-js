import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { AcceptCallButton, RejectCallButton } from '.';

/**
 * Props for the IncomingCallControls Component.
 */
export type IncomingCallControlsProps = {
  /**
   * Handler to be executed when an incoming call is accepted
   */
  onAcceptCallHandler?: (err?: Error) => void;
  /**
   * Handler to be executed when an incoming call is rejected
   */
  onRejectCallHandler?: (err?: Error) => void;

  disabled?: boolean;
};

export const IncomingCallControls = ({
  onAcceptCallHandler,
  onRejectCallHandler,
  disabled = false,
}: IncomingCallControlsProps) => {
  const {
    theme: { incomingCall },
  } = useTheme();
  return (
    <View style={[styles.buttonGroup, incomingCall.buttonGroup]}>
      <View style={incomingCall.button}>
        <RejectCallButton
          onRejectCallHandler={onRejectCallHandler}
          rejectReason="decline"
          disabled={disabled}
        />
        <Text style={[incomingCall.buttonText]}>Decline</Text>
      </View>
      <View style={incomingCall.button}>
        <AcceptCallButton
          onAcceptCallHandler={onAcceptCallHandler}
          disabled={disabled}
        />
        <Text style={[incomingCall.buttonText]}>Accept</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
