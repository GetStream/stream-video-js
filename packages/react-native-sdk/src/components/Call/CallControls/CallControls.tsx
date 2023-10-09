import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
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
  Pick<HangUpCallButtonProps, 'onHangupCallHandler'> & {
    /**
     * Check if device is in landscape mode.
     * This will apply the landscape mode styles to the component.
     */
    landscape?: boolean;
  };

/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallControls = ({
  style,
  onHangupCallHandler,
  landscape,
}: CallControlProps) => {
  const {
    theme: { colors, callControls },
  } = useTheme();
  const landScapeStyles: ViewStyle = {
    flexDirection: landscape ? 'column-reverse' : 'row',
    paddingHorizontal: landscape ? 12 : 0,
    paddingVertical: landscape ? 0 : 12,
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
