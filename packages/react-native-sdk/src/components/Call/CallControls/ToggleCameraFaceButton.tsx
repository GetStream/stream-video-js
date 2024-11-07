import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { CameraSwitch, IconWrapper } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { ColorValue } from 'react-native';

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
  backgroundColor,
}: ToggleCameraFaceButtonProps) => {
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, optimisticIsMute, direction } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;

  const {
    theme: { colors, toggleCameraFaceButton, variants },
  } = useTheme();
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
      <CallControlsButton
        size={variants.roundButtonSizes.md}
        onPress={onPress}
        color={backgroundColor || colors.buttonSecondaryDefault}
        disabledColor={colors.sheetPrimary}
        disabled={optimisticIsMute}
        style={toggleCameraFaceButton}
      >
        <IconWrapper>
          <CameraSwitch
            size={variants.iconSizes.md}
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
