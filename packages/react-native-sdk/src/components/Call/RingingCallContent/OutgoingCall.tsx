import React from 'react';
import {
  StyleSheet,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { UserInfo } from './UserInfo';
import { Z_INDEX } from '../../../constants';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  CallControls as DefaultCallControls,
  type CallControlProps,
  type OutgoingCallControlsProps,
} from '../CallControls';
import {
  CallAppBar as DefaultCallAppBar,
  type CallAppBarProps,
} from '../CallControls/CallAppBar';
import { LobbyCameraPreview } from '../Lobby';
import { useI18n } from '../../../i18n';

/**
 * Props for the OutgoingCall Component.
 */
export type OutgoingCallProps = OutgoingCallControlsProps & {
  /**
   * Component to customize the top bar of the outgoing call.
   */
  CallAppBar?: React.ComponentType<CallAppBarProps> | null;
  /**
   * Component to customize the controls of the outgoing call.
   */
  CallControls?: React.ComponentType<CallControlProps> | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;

  style?: StyleProp<ViewStyle>;
};

/**
 * An outgoing call with the callee's avatar, name, caller's camera in background, reject and mute buttons.
 * Used after the user has initiated a call.
 */
export const OutgoingCall = ({
  onHangupCallHandler,
  CallAppBar = DefaultCallAppBar,
  CallControls = DefaultCallControls,
  style,
}: OutgoingCallProps) => {
  const {
    theme: { outgoingCall },
  } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          outgoingCall.container,
          style,
        ]}
      >
        {CallAppBar && <CallAppBar onHangupCallHandler={onHangupCallHandler} />}
        <View style={[styles.content, outgoingCall.content]}>
          <UserInfo color="accent" />
          <Text style={[styles.callingText, outgoingCall.callingText]}>
            {t('ringingCall.outgoing.title', 'Calling...')}
          </Text>
        </View>
        {CallControls && <CallControls />}
      </View>

      <Background />
    </>
  );
};

const Background = () => {
  const {
    theme: { outgoingCall },
  } = useTheme();
  const { useCameraState } = useCallStateHooks();
  const { optimisticIsMute } = useCameraState();

  if (optimisticIsMute) {
    return <View style={[styles.background, outgoingCall.background]} />;
  }

  return (
    <View style={[styles.background, outgoingCall.background]}>
      <LobbyCameraPreview />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    zIndex: Z_INDEX.IN_MIDDLE,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callingText: {
    textAlign: 'center',
  },
  outgoingCallControls: {
    justifyContent: 'center',
  },
});
