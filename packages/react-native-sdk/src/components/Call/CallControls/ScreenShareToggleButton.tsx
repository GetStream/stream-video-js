import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare } from '../../../icons/ScreenShare';
import { StopScreenShare } from '../../../icons/StopScreenShare';
import { CallControlsButton } from './CallControlsButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useScreenShareButton } from '../../../hooks/useScreenShareButton';
import { IconWrapper } from '../../../icons';

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
    theme: { colors, screenShareToggleButton, variants },
  } = useTheme();

  const screenCapturePickerViewiOSRef = useRef(null);

  const { onPress, hasPublishedScreenShare } = useScreenShareButton(
    screenCapturePickerViewiOSRef,
    onScreenShareStartedHandler,
    onScreenShareStoppedHandler,
  );

  if (!onPress) return null;

  return (
    <CallControlsButton
      onPress={onPress}
      color={
        hasPublishedScreenShare ? colors.buttonWarning : colors.buttonSecondary
      }
      style={{
        container: screenShareToggleButton.container,
        svgContainer: screenShareToggleButton.svgContainer,
      }}
    >
      <IconWrapper>
        {hasPublishedScreenShare ? (
          <StopScreenShare
            size={variants.iconSizes.md}
            color={colors.iconPrimary}
          />
        ) : (
          <ScreenShare
            size={variants.iconSizes.md}
            color={colors.iconPrimary}
          />
        )}
      </IconWrapper>
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </CallControlsButton>
  );
};
