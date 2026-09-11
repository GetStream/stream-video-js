import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useI18n } from '@stream-io/video-react-bindings';
import { UserInfo } from './UserInfo';
import {
  IncomingCallControls as DefaultIncomingCallControls,
  type IncomingCallControlsProps,
} from '../CallControls';
import { useTheme } from '../../../contexts';

/**
 * Props for the IncomingCall Component.
 */
export type IncomingCallProps = IncomingCallControlsProps & {
  /**
   * Prop to customize the IncomingCall controls.
   */
  IncomingCallControls?: React.ComponentType<IncomingCallControlsProps> | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;

  isConnecting?: boolean;
};

/**
 * An incoming call with the caller's avatar, name and accept/reject buttons.
 * Used when the user is receiving a call.
 */
export const IncomingCall = ({
  onAcceptCallHandler,
  onRejectCallHandler,
  IncomingCallControls = DefaultIncomingCallControls,
  landscape,
  isConnecting = false,
}: IncomingCallProps) => {
  const { t } = useI18n();
  const {
    theme: { incomingCall, insets },
  } = useTheme();

  const landscapeContentStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  const insetStyles: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View
      style={[
        styles.content,
        landscapeContentStyles,
        insetStyles,
        incomingCall.content,
      ]}
    >
      <View style={[styles.topContainer, incomingCall.topContainer]}>
        <UserInfo />
        <Text style={[styles.incomingCallText, incomingCall.incomingCallText]}>
          {isConnecting ? t('Connecting...') : t('Incoming Call...')}
        </Text>
      </View>
      <View style={[styles.bottomContainer, incomingCall.bottomContainer]}>
        {IncomingCallControls && (
          <IncomingCallControls
            disabled={isConnecting}
            onAcceptCallHandler={onAcceptCallHandler}
            onRejectCallHandler={onRejectCallHandler}
          />
        )}
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'stretch',
  },
  topContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingCallText: {
    textAlign: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
