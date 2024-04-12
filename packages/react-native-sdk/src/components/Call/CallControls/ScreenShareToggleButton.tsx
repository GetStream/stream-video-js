import React from 'react';
import { Platform } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare, StopScreenShare } from '../../../icons';
import { CallControlsButton } from './CallControlsButton';
import { useTheme } from '../../../contexts';
import { useScreenShareToggle } from '../../../hooks/useScreenShareToggle';

/**
 * The props for the Screen Share button in the Call Controls.
 */
export type ScreenShareToggleButtonProps = {
  /**
   * Handler to be called when the screen-share has been started.
   *
   */
  onScreenShareStartedHandler?: () => void;
  /**
   * Handler to be called when the screen-share has been stopped.
   *
   */
  onScreenShareStoppedHandler?: () => void;
};

/**
 * Button to start/stop screen share.
 * Note: This button is enabled only on iOS >= 14.0 and any Android version.
 */
export const ScreenShareToggleButton = ({
  onScreenShareStartedHandler,
  onScreenShareStoppedHandler,
}: ScreenShareToggleButtonProps) => {
  const {
    theme: { colors, screenShareToggleButton },
  } = useTheme();

  const {
    hasPublishedScreenShare,
    isScreenSharingEnabledInCall,
    isScreenSharingAccessRequestEnabled,
    CanDeviceScreenShare,
    onPress,
    screenCapturePickerViewiOSRef,
  } = useScreenShareToggle({
    onScreenShareStartedHandler,
    onScreenShareStoppedHandler,
  });

  if (!isScreenSharingEnabledInCall || !CanDeviceScreenShare) {
    return null;
  }

  return (
    <CallControlsButton
      disabled={!isScreenSharingAccessRequestEnabled}
      onPress={onPress}
      color={hasPublishedScreenShare ? colors.error : colors.static_white}
      style={{
        container: screenShareToggleButton.container,
        svgContainer: screenShareToggleButton.svgContainer,
      }}
    >
      {hasPublishedScreenShare ? (
        <StopScreenShare color={colors.static_black} />
      ) : (
        <ScreenShare color={colors.static_black} />
      )}
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </CallControlsButton>
  );
};
