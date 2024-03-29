import React from 'react';
import { Platform } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare } from '../../../icons';
import { CallControlsButton } from './CallControlsButton';
import { useTheme } from '../../../contexts';
import useScreenShare from '../../../hooks/useScreenShare';

/**
 * The props for the Screen Share button in the Call Controls.
 */
export type ScreenShareButtonProps = {
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
export const ScreenShareButton = ({
  onScreenShareStartedHandler,
  onScreenShareStoppedHandler,
}: ScreenShareButtonProps) => {
  const {
    theme: { colors, screenShareButton },
  } = useTheme();

  const {
    isScreenSharingEnabledInCall,
    isScreenSharingAccessRequestEnabled,
    CanDeviceScreenShare,
    onPress,
    screenCapturePickerViewiOSRef,
  } = useScreenShare({
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
      color={colors.static_white}
      style={{
        container: screenShareButton.container,
        svgContainer: screenShareButton.svgContainer,
      }}
    >
      <ScreenShare color={colors.static_black} />
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </CallControlsButton>
  );
};
