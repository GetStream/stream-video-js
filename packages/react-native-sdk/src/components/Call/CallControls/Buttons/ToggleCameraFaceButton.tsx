import React from 'react';
import { type ColorValue } from 'react-native';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CameraSwitch, ControlButtonIcon } from '../../../../icons';
import { CallControlsButton } from '..';

/**
 * Props for the Toggle Camera face button.
 */
export type ToggleCameraFaceButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;

  /**
   * Background color of the button.
   */
  backgroundColor?: ColorValue;
};

/**
 * Button to toggle camera face(front/back) when in the call.
 */
export const ToggleCameraFaceButton = ({
  onPressHandler,
}: ToggleCameraFaceButtonProps) => {
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, optimisticIsMute } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;

  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }

    await camera.flip();
  };

  if (!isVideoEnabledInCall) {
    return;
  }

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton onPress={onPress} disabled={optimisticIsMute}>
        <ControlButtonIcon icon={CameraSwitch} />
      </CallControlsButton>
    </Restricted>
  );
};
