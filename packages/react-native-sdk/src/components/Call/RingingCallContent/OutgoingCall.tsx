import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfo } from './UserInfo';
import { useLocalVideoStream } from '../../../hooks/useLocalVideoStream';
import { Z_INDEX } from '../../../constants';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { RTCView } from '@stream-io/react-native-webrtc';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  OutgoingCallControls as DefaultOutgoingCallControls,
  OutgoingCallControlsProps,
} from '../CallControls';
import {
  CallTopView as DefaultCallTopView,
  CallTopViewProps,
} from '../CallTopView';

/**
 * Props for the OutgoingCall Component.
 */
export type OutgoingCallProps = OutgoingCallControlsProps & {
  /**
   * Prop to customize the CallTopView component in the IncomingCall component.
   */
  CallTopView?: React.ComponentType<CallTopViewProps> | null;
  /**
   * Prop to customize the OutgoingCall controls.
   */
  OutgoingCallControls?: React.ComponentType<OutgoingCallControlsProps> | null;
};

/**
 * An outgoing call with the callee's avatar, name, caller's camera in background, reject and mute buttons.
 * Used after the user has initiated a call.
 */
export const OutgoingCall = ({
  CallTopView = DefaultCallTopView,
  OutgoingCallControls = DefaultOutgoingCallControls,
}: OutgoingCallProps) => {
  const {
    theme: { colors, typefaces, outgoingCall },
  } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          outgoingCall.container,
        ]}
      >
        {CallTopView && <CallTopView />}
        <View style={[styles.content, outgoingCall.content]}>
          <UserInfo />
          <Text
            style={[
              styles.callingText,
              { color: colors.static_white },
              typefaces.heading6,
              outgoingCall.callingText,
            ]}
          >
            {t('Calling...')}
          </Text>
        </View>
        <View
          style={[
            styles.outgoingCallControls,
            outgoingCall.outgoingCallControls,
          ]}
        >
          {OutgoingCallControls && <OutgoingCallControls />}
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

  const localVideoStream = useLocalVideoStream();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();

  if (status === 'disabled' || !localVideoStream) {
    return (
      <View
        style={[
          styles.background,
          { backgroundColor: colors.static_grey },
          outgoingCall.background,
        ]}
      />
    );
  }
  return (
    <View
      style={[
        styles.background,
        { backgroundColor: colors.static_grey },
        outgoingCall.background,
      ]}
    >
      <RTCView
        streamURL={localVideoStream?.toURL()}
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
  content: {
    paddingTop: 8,
  },
  callingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  outgoingCallControls: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
  },
});
