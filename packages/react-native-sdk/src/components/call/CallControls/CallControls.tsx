import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../../../theme';
import { ToggleAudioPublishingButton } from './ToggleAudioPublishingButton';
import { ToggleVideoPublishingButton } from './ToggleVideoPublishingButton';
import { ToggleCameraFaceButton } from './ToggleCameraFaceButton';
import { Z_INDEX } from '../../../constants';
import { HangUpCallButton } from './HangupCallButton';

/**
 * Props for the CallControls Component.
 */
export interface CallControlsType extends Pick<ViewProps, 'style'> {
  /**
   * Handler to override the hang up handler when the hangup button is pressed.
   * @returns void
   */
  onHangupCallHandler?: () => void;
}

/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallControls = ({
  onHangupCallHandler,
  style,
}: CallControlsType) => {
  return (
    <View style={[styles.container, style]}>
      <ToggleVideoPublishingButton />
      <ToggleAudioPublishingButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton onPressHandler={onHangupCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.padding.md,
    paddingBottom: theme.padding.lg,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: theme.light.static_grey,
  },
});
