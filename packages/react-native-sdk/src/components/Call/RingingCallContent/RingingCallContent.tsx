import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CallContent as DefaultCallContent,
  CallContentProps,
} from '../CallContent';
import { CallTopViewProps } from '../CallTopView';
import {
  IncomingCall as DefaultIncomingCall,
  IncomingCallProps,
} from './IncomingCall';
import {
  OutgoingCall as DefaultOutgoingCall,
  OutgoingCallProps,
} from './OutgoingCall';
import { JoiningCallIndicator as DefaultJoiningCallIndicator } from './JoiningCallIndicator';
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
   * Prop to customize the CallTopView component in the RingingCallContent.
   */
  CallTopView?: React.ComponentType<CallTopViewProps> | null;
  /**
   * Prop to customize the JoiningCallIndicator component in the RingingCallContent. It is shown when the call is accepted and is waiting to be joined.
   */
  JoiningCallIndicator?: React.ComponentType | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
};

const RingingCallPanel = ({
  IncomingCall = DefaultIncomingCall,
  OutgoingCall = DefaultOutgoingCall,
  CallContent = DefaultCallContent,
  JoiningCallIndicator = DefaultJoiningCallIndicator,
  CallTopView,
  landscape,
}: RingingCallContentProps) => {
  const call = useCall();
  const isCallCreatedByMe = call?.isCreatedByMe;

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  switch (callingState) {
    case CallingState.RINGING:
      return isCallCreatedByMe
        ? OutgoingCall && <OutgoingCall CallTopView={CallTopView} />
        : IncomingCall && <IncomingCall CallTopView={CallTopView} />;
    case CallingState.JOINED:
      return (
        CallContent && (
          <CallContent CallTopView={CallTopView} landscape={landscape} />
        )
      );
    case CallingState.JOINING:
      return JoiningCallIndicator && <JoiningCallIndicator />;
    default:
      return null;
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
