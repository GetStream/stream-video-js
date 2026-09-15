import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { ScreenShare, ControlButtonIcon } from '../../../../icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  useScreenShareButton,
  type ScreenShareOptions,
} from '../../../../hooks/useScreenShareButton';
import { CallControlsButton } from '..';

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
  /**
   * Options for screen share behavior (type, includeAudio).
   */
  screenShareOptions?: ScreenShareOptions;
};

/**
 * Button to start/stop screen share.
 * Note: This button is enabled only on iOS >= 14.0 and any Android version.
 */
export const ScreenShareToggleButton = ({
  onScreenShareStartedHandler,
  onScreenShareStoppedHandler,
  screenShareOptions,
}: ScreenShareToggleButtonProps) => {
  const {
    theme: { semantics },
  } = useTheme();

  const screenCapturePickerViewiOSRef = useRef(null);

  const { onPress, hasPublishedScreenShare } = useScreenShareButton(
    screenCapturePickerViewiOSRef,
    onScreenShareStartedHandler,
    onScreenShareStoppedHandler,
    undefined,
    screenShareOptions,
  );

  if (!onPress) return null;

  return (
    <CallControlsButton
      onPress={onPress}
      color={hasPublishedScreenShare ? semantics.buttonPrimaryBg : undefined}
    >
      <ControlButtonIcon
        icon={ScreenShare}
        turnedOn={!hasPublishedScreenShare}
      />
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </CallControlsButton>
  );
};
