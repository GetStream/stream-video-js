import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { ToggleAudioPublishingButton } from './ToggleAudioPublishingButton';
import { ToggleVideoPublishingButton } from './ToggleVideoPublishingButton';
import { ToggleCameraFaceButton } from './ToggleCameraFaceButton';
import { Z_INDEX } from '../../../constants';
import { HangUpCallButton, HangUpCallButtonProps } from './HangupCallButton';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the CallControls Component.
 */
export type CallControlProps = Pick<ViewProps, 'style'> &
  Pick<HangUpCallButtonProps, 'onHangupCallHandler'>;

/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallControls = ({
  style,
  onHangupCallHandler,
}: CallControlProps) => {
  const {
    theme: { colors, callControls },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_grey },
        style,
        callControls.container,
      ]}
    >
      <ToggleVideoPublishingButton />
      <ToggleAudioPublishingButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton onHangupCallHandler={onHangupCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: Z_INDEX.IN_FRONT,
  },
});
