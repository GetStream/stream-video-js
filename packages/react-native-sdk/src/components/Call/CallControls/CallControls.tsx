import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { ToggleAudioPublishingButton } from './ToggleAudioPublishingButton';
import { ToggleVideoPublishingButton } from './ToggleVideoPublishingButton';
import { ToggleCameraFaceButton } from './ToggleCameraFaceButton';
import { Z_INDEX } from '../../../constants';
import { HangUpCallButton } from './HangupCallButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOrientation } from '../../../utils/hooks/useOrientation';

/**
 * Props for the CallControls Component.
 */
export type CallControlProps = Pick<ViewProps, 'style'> & {
  /**
   * Handler to override the hang up handler when the hangup button is pressed.
   * @returns void
   */
  onHangupCallHandler?: () => void;
};

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
  const orientation = useOrientation();
  const landScapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'column-reverse' : 'row',
    paddingHorizontal: orientation === 'landscape' ? 12 : 0,
    paddingVertical: orientation === 'portrait' ? 12 : 0,
  };
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_grey },
        callControls.container,
        landScapeStyles,
        style,
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
    justifyContent: 'space-evenly',
    zIndex: Z_INDEX.IN_FRONT,
  },
});
