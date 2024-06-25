import React, { useEffect, useRef } from 'react';
import { findNodeHandle, NativeModules, Platform } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare } from '../../../icons/ScreenShare';
import { StopScreenShare } from '../../../icons/StopScreenShare';
import { CallControlsButton } from './CallControlsButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useScreenShareButton } from '../../../hooks/useScreenShareButton';

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

  const screenCapturePickerViewiOSRef = useRef(null);

  const { onPress, hasPublishedScreenShare } = useScreenShareButton(
    screenCapturePickerViewiOSRef,
    onScreenShareStartedHandler,
    onScreenShareStoppedHandler
  );

  if (!onPress) return null;

  return (
    <CallControlsButton
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
