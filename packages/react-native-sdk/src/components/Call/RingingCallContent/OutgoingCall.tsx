import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { UserInfo } from './UserInfo';
import { Z_INDEX } from '../../../constants';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { MediaStream, RTCView } from '@stream-io/react-native-webrtc';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  OutgoingCallControls as DefaultOutgoingCallControls,
  type OutgoingCallControlsProps,
} from '../CallControls';

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
  OutgoingCallControls = DefaultOutgoingCallControls,
  landscape,
}: OutgoingCallProps) => {
  const {
    theme: { colors, typefaces, outgoingCall },
  } = useTheme();
  const { t } = useI18n();

  const landscapeContentStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          outgoingCall.container,
        ]}
      >
        <View
          style={[styles.content, landscapeContentStyles, outgoingCall.content]}
        >
          <View style={[styles.topContainer, outgoingCall.topContainer]}>
            <UserInfo />
            <Text
              style={[
                styles.callingText,
                { color: colors.textPrimary },
                typefaces.heading6,
                outgoingCall.callingText,
              ]}
            >
              {t('Calling...')}
            </Text>
          </View>
          <View style={[styles.bottomContainer, outgoingCall.bottomContainer]}>
            <View
              style={[
                styles.outgoingCallControls,
                outgoingCall.outgoingCallControls,
              ]}
            >
              {OutgoingCallControls && <OutgoingCallControls />}
            </View>
          </View>
        </View>
      </View>

      <Background />
    </>
  );
};

const Background = () => {
  const {
    theme: { colors, outgoingCall },
  } = useTheme();
  const { useCameraState } = useCallStateHooks();
  const { isMute, camera } = useCameraState();
  const localVideoStream = camera.state.mediaStream as unknown as
    | MediaStream
    | undefined;

  if (isMute || !localVideoStream) {
    return (
      <View
        style={[
          styles.background,
          { backgroundColor: colors.sheetSecondary },
          outgoingCall.background,
        ]}
      />
    );
  }
  return (
    <View
      style={[
        styles.background,
        { backgroundColor: colors.sheetSecondary },
        outgoingCall.background,
      ]}
    >
      <RTCView
        streamURL={localVideoStream.toURL()}
        zOrder={Z_INDEX.IN_BACK}
        style={StyleSheet.absoluteFill}
        mirror
        objectFit="cover"
      />
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
  topContainer: { flex: 1, justifyContent: 'center' },
  content: {
    flex: 1,
  },
  callingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  bottomContainer: { flex: 1, alignSelf: 'center', justifyContent: 'center' },
  outgoingCallControls: {
    justifyContent: 'center',
  },
});
