import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
  const isCallCreatedByMe = call?.isCreatedByMe;

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

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
