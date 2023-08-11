import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { useMediaStreamManagement } from '../../../providers/MediaStreamManagement';
import { muteStatusColor } from '../../../utils';
import { CameraSwitch } from '../../../icons';
import { theme } from '../../../theme';

/**
 * Props for the Toggle Camera face button.
 */
export type ToggleCameraFaceButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle camera face(front/back) when in the call.
 */
export const ToggleCameraFaceButton = ({
  onPressHandler,
}: ToggleCameraFaceButtonProps) => {
  const { isVideoMuted, isCameraOnFrontFacingMode, toggleCameraFacingMode } =
    useMediaStreamManagement();

  const toggleCameraFaceHandler = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleCameraFacingMode();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        disabled={isVideoMuted}
        onPress={toggleCameraFaceHandler}
        color={muteStatusColor(!isCameraOnFrontFacingMode)}
      >
        <CameraSwitch
          color={
            isCameraOnFrontFacingMode
              ? theme.light.static_black
              : theme.light.static_white
          }
        />
      </CallControlsButton>
    </Restricted>
  );
};
