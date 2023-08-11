import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCameraState,
} from '@stream-io/video-react-bindings';
import React from 'react';
import { CallControlsButton } from './CallControlsButton';
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
  const call = useCall();
  const { status, direction } = useCameraState();

  const onPress = async () => {
    onPressHandler?.();
    await call?.camera.flip();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        onPress={onPress}
        color={muteStatusColor(direction === 'back')}
        disabled={status === 'disabled'}
      >
        <CameraSwitch
          color={
            direction === 'front'
              ? theme.light.static_black
              : theme.light.static_white
          }
        />
      </CallControlsButton>
    </Restricted>
  );
};
