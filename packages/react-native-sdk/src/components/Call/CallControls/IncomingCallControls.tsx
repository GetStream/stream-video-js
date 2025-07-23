import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { AcceptCallButton } from './AcceptCallButton';
import { RejectCallButton } from './RejectCallButton';
import { useCall, useCalls } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../../../utils';
import { CallingState, getLogger } from '@stream-io/video-client';

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

  const call = useCall();
  const calls = useCalls();

  useEffect(() => {
    if (!shouldRejectCallWhenBusy) return;
    const ringingCallsInProgress = calls.filter(
      (c) => c.ringing && c.state.callingState === CallingState.JOINED,
    );
    const alreadyInAnotherRingingCall = ringingCallsInProgress.length > 0;

    if (alreadyInAnotherRingingCall) {
      call?.leave({ reject: true, reason: 'busy' }).catch((err) => {
        const logger = getLogger(['IncomingCallControls']);
        logger('error', 'Error rejecting Call when busy', err);
      });
    }
  }, [calls, call, shouldRejectCallWhenBusy]);

  return (
    <View style={[styles.buttonGroup, incomingCall.buttonGroup]}>
      <RejectCallButton
        onPressHandler={onRejectCallHandler}
        size={buttonSizes.md}
        rejectReason={'decline'}
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
