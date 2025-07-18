import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { AcceptCallButton } from './AcceptCallButton';
import { RejectCallButton } from './RejectCallButton';
import { useCalls } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../../../utils';

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

  const pushConfig = StreamVideoRN.getConfig().push;
  const shouldRejectCallWhenBusy =
    (Platform.OS === 'ios' && pushConfig?.ios?.shouldRejectCallWhenBusy) ||
    (Platform.OS === 'android' &&
      pushConfig?.android?.shouldRejectCallWhenBusy);

  const calls = useCalls();
  const ringingCalls = calls.filter((c) => c.ringing);
  const alreadyInAnotherRingingCall = ringingCalls.length > 1;
  const isCalleeBusy = alreadyInAnotherRingingCall && shouldRejectCallWhenBusy;
  const rejectReason = isCalleeBusy ? 'busy' : 'decline';

  return (
    <View style={[styles.buttonGroup, incomingCall.buttonGroup]}>
      <RejectCallButton
        onPressHandler={onRejectCallHandler}
        size={buttonSizes.md}
        rejectReason={rejectReason}
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
