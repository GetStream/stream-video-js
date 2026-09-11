import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { UserInfo } from './UserInfo';
import { Z_INDEX } from '../../../constants';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';
import { CallControls, type OutgoingCallControlsProps } from '../CallControls';
import { CallAppBar } from '../CallControls/CallAppBar';
import { LobbyCameraPreview } from '../Lobby';

/**
 * Props for the OutgoingCall Component.
 */
export type OutgoingCallProps = OutgoingCallControlsProps & {
  /**
   * Prop to customize the OutgoingCall controls.
   */
  OutgoingCallControls?: React.ComponentType<OutgoingCallControlsProps> | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
};

/**
 * An outgoing call with the callee's avatar, name, caller's camera in background, reject and mute buttons.
 * Used after the user has initiated a call.
 */
export const OutgoingCall = ({
  onHangupCallHandler,
  landscape,
}: OutgoingCallProps) => {
  const {
    theme: { outgoingCall, insets },
  } = useTheme();
  const { t } = useI18n();

  void landscape;

  const insetStyles: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          outgoingCall.container,
          insetStyles,
        ]}
      >
        <CallAppBar onHangupCallHandler={onHangupCallHandler} />
        <View style={[styles.content, outgoingCall.content]}>
          <UserInfo color="accent" />
          <Text style={[styles.callingText, outgoingCall.callingText]}>
            {t('Calling...')}
          </Text>
        </View>
        <CallControls />
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

  const wantsCamera = !optimisticIsMute;

  if (!wantsCamera) {
    return <View style={[styles.background, outgoingCall.background]} />;
  }

  return (
    <View style={[styles.background, outgoingCall.background]}>
      <LobbyCameraPreview style={StyleSheet.absoluteFill} objectFit="cover" />
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
