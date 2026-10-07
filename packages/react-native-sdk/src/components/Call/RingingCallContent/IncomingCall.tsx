import React from 'react';
import {
  StyleSheet,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { UserInfo } from './UserInfo';
import {
  IncomingCallControls as DefaultIncomingCallControls,
  type IncomingCallControlsProps,
} from '../CallControls';
import { useTheme } from '../../../contexts';
import { useI18n } from '../../../i18n';

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

  style?: StyleProp<ViewStyle>;
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
  style,
}: IncomingCallProps) => {
  const { t } = useI18n();
  const {
    theme: { incomingCall },
  } = useTheme();

  const landscapeContentStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <View
      style={[
        styles.content,
        landscapeContentStyles,
        incomingCall.content,
        style,
      ]}
    >
      <View style={[styles.topContainer, incomingCall.topContainer]}>
        <UserInfo />
        <Text style={[styles.incomingCallText, incomingCall.incomingCallText]}>
          {isConnecting
            ? t('common.connecting.text', 'Connecting...')
            : t('ringingCall.incoming.title', 'Incoming Call...')}
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
