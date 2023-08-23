import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserInfo } from './UserInfo';
import { useLocalVideoStream } from '../../../hooks/useLocalVideoStream';
import { theme } from '../../../theme';
import { Z_INDEX } from '../../../constants';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { RTCView } from '@stream-io/react-native-webrtc';
import {
  CallTopView as DefaultCallTopView,
  CallTopViewProps,
} from '../CallTopView';
import {
  OutgoingCallControls as DefaultOutgoingCallControls,
  OutgoingCallControlsProps,
} from '../CallControls';

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
  const { t } = useI18n();

  return (
    <>
      {CallTopView && <CallTopView />}
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <View>
          <UserInfo />
          <Text style={styles.callingText}>{t('Calling...')}</Text>
        </View>
        {OutgoingCallControls && <OutgoingCallControls />}
      </View>
      <Background />
    </>
  );
};

const Background = () => {
  const localVideoStream = useLocalVideoStream();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();

  if (status === 'disabled' || !localVideoStream) {
    return <View style={styles.background} />;
  }
  return (
    <View style={styles.background}>
      <RTCView
        streamURL={localVideoStream?.toURL()}
        zOrder={Z_INDEX.IN_BACK}
        style={StyleSheet.absoluteFill}
        mirror
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: Z_INDEX.IN_MIDDLE,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 2 * theme.margin.xl,
  },
  background: {
    backgroundColor: theme.light.static_grey,
    flex: 1,
  },
  callingText: {
    marginTop: theme.margin.md,
    textAlign: 'center',
    color: theme.light.static_white,
    ...theme.fonts.heading6,
  },
});
