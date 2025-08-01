import React, { useEffect } from 'react';
import { CallingState, getLogger } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { Platform, StyleSheet, View } from 'react-native';
import {
  CallContent as DefaultCallContent,
  type CallContentProps,
} from '../CallContent';
import {
  IncomingCall as DefaultIncomingCall,
  type IncomingCallProps,
} from './IncomingCall';
import {
  OutgoingCall as DefaultOutgoingCall,
  type OutgoingCallProps,
} from './OutgoingCall';
import {
  CallLeftIndicator as DefaultCallLeftIndicator,
  type CallLeftIndicatorProps,
} from './CallLeftIndicator';
import {
  CallPreparingIndicator as DefaultCallPreparingIndicator,
  type CallPreparingIndicatorProps,
} from './CallPreparingIndicator';
import { useTheme } from '../../../contexts';
import InCallManager from 'react-native-incall-manager';
import { StreamVideoRN } from '../../../utils/StreamVideoRN';

/**
 * Props for the RingingCallContent component
 */
export type RingingCallContentProps = {
  /**
   * Prop to customize the IncomingCall component in the RingingCallContent.
   */
  IncomingCall?: React.ComponentType<IncomingCallProps> | null;
  /**
   * Prop to customize the OutgoingCall component in the RingingCallContent.
   */
  OutgoingCall?: React.ComponentType<OutgoingCallProps> | null;
  /**
   * Prop to customize the accepted CallContent component in the RingingCallContent. This is shown after the call is accepted.
   */
  CallContent?: React.ComponentType<CallContentProps> | null;
  /**
   * Prop to override the component shown when the call is left.
   */
  CallLeftIndicator?: React.ComponentType<CallLeftIndicatorProps> | null;
  /**
   * Prop to override the component shown when the call is in idle state.
   */
  CallPreparingIndicator?: React.ComponentType<CallPreparingIndicatorProps> | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
  /**
   * Callback to handle the back icon press event
   * in CallLeftIndicator and CallPreparingIndicator components.
   */
  onBackPress?: () => void;
};

const RingingCallPanel = ({
  IncomingCall = DefaultIncomingCall,
  OutgoingCall = DefaultOutgoingCall,
  CallContent = DefaultCallContent,
  CallLeftIndicator = DefaultCallLeftIndicator,
  CallPreparingIndicator = DefaultCallPreparingIndicator,
  landscape,
  onBackPress,
}: RingingCallContentProps) => {
  const call = useCall();
  const calls = useCalls();
  const isCallCreatedByMe = call?.isCreatedByMe;

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const client = useStreamVideoClient();

  client?.on('call.rejected', async (event) => {
    // Workaround needed for the busy tone:
    // This is because the call was rejected without even starting,
    // before calling the stop method with busy tone we need to start the call first.
    InCallManager.start({ media: 'audio' });

    const callCid = event.call_cid;
    const callId = callCid.split(':')[1];
    const rejectedCall = client?.call(event.call.type, callId);
    await rejectedCall?.getOrCreate();

    const isCalleeBusy =
      rejectedCall && rejectedCall.isCreatedByMe && event.reason === 'busy';

    if (isCalleeBusy) {
      InCallManager.stop({ busytone: '_DTMF_' });
    }
  });

  const pushConfig = StreamVideoRN.getConfig().push;
  const shouldRejectCallWhenBusy = pushConfig?.shouldRejectCallWhenBusy;

  useEffect(() => {
    // android rejection is done in android's firebaseDataHandler
    if (Platform.OS === 'android') return;
    if (!shouldRejectCallWhenBusy) return;

    const ringingCallsInProgress = calls.filter(
      (c) => c.ringing && c.state.callingState === CallingState.JOINED,
    );
    const callsForRejection = calls.filter(
      (c) => c.ringing && c.state.callingState === CallingState.RINGING,
    );
    const alreadyInAnotherRingingCall = ringingCallsInProgress.length > 0;
    if (callsForRejection.length > 0 && alreadyInAnotherRingingCall) {
      callsForRejection.forEach((c) => {
        c.leave({ reject: true, reason: 'busy' }).catch((err) => {
          const logger = getLogger(['RingingCallContent']);
          logger('error', 'Error rejecting Call when busy', err);
        });
      });
    }
  }, [calls, call, shouldRejectCallWhenBusy]);

  switch (callingState) {
    case CallingState.RINGING:
      return isCallCreatedByMe
        ? OutgoingCall && <OutgoingCall landscape={landscape} />
        : IncomingCall && <IncomingCall landscape={landscape} />;
    case CallingState.LEFT:
      return (
        CallLeftIndicator && <CallLeftIndicator onBackPress={onBackPress} />
      );
    case CallingState.IDLE:
      return (
        CallPreparingIndicator && (
          <CallPreparingIndicator onBackPress={onBackPress} />
        )
      );
    default:
      return CallContent && <CallContent landscape={landscape} />;
  }
};

/**
 * Component to show the Incoming, Outgoing and CalContent component depending upon the Call states when the call is in ringing mode.
 */
export const RingingCallContent = (props: RingingCallContentProps) => {
  const {
    theme: { ringingCallContent },
  } = useTheme();
  return (
    <View style={[styles.container, ringingCallContent.container]}>
      <RingingCallPanel {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
