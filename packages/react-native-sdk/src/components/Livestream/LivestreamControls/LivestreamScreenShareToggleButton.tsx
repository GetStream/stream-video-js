import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  ScreenShare,
  StopScreenShare,
  ControlButtonIcon,
} from '../../../icons';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { useScreenShareButton } from '../../../hooks/useScreenShareButton';
import { CallControlsButton } from '../../Call/CallControls/Buttons/CallControlsButton';

export type LivestreamScreenShareToggleButtonProps = {};

/**
 * The LivestreamVideoControlButton controls the screenshare stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamScreenShareToggleButton = () => {
  const {
    theme: { colors },
  } = useTheme();

  const screenCapturePickerViewiOSRef = React.useRef(null);

  const { onPress, hasPublishedScreenShare } = useScreenShareButton(
    screenCapturePickerViewiOSRef,
  );

  return (
    <CallControlsButton
      onPress={onPress}
      color={
        hasPublishedScreenShare ? colors.buttonWarning : colors.buttonSecondary
      }
    >
      <ControlButtonIcon
        icon={hasPublishedScreenShare ? StopScreenShare : ScreenShare}
        disabled={hasPublishedScreenShare}
      />
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </CallControlsButton>
  );
};
