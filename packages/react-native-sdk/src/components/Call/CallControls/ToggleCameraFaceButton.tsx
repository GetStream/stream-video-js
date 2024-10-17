import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { CameraSwitch, IconWrapper } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, optimisticIsMute, direction } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;

  const {
    theme: { colors, toggleCameraFaceButton, defaults },
  } = useTheme();
  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }

    // TODO: investigate camera on off issues and flip operation not working
    try {
      await camera.flip();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isVideoEnabledInCall) {
    return;
  }

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        onPress={onPress}
        color={colors.sheetPrimary}
        disabledColor={colors.sheetPrimary}
        disabled={optimisticIsMute}
        style={toggleCameraFaceButton}
      >
        <IconWrapper>
          <CameraSwitch
            size={defaults.iconSize}
            color={
              optimisticIsMute
                ? colors.buttonPrimaryDisabled
                : direction === 'front' || direction === undefined
                  ? colors.iconPrimaryDefault
                  : colors.buttonPrimaryDefault
            }
          />
        </IconWrapper>
      </CallControlsButton>
    </Restricted>
  );
};
