import React, { useState } from 'react';
import { IconWrapper } from '../../../icons/IconWrapper';
import { CallControlsButton, useTheme } from '../../..';
import { Effects } from '../../../icons/Effects';

/**
 * The props for the Flip Camera Button in the camera Controls.
 */
export type VideoEffectsButtonProps = {
  /**
   * Handler to be called when the flip camera button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * The flip camera Button is used in the camera Controls component
 * and allows the user to toggle camera flipping.
 */
export const VideoEffectsButton = ({
  onPressHandler,
}: VideoEffectsButtonProps) => {
  const {
    theme: { colors, flipCameraButton, defaults, variants },
  } = useTheme();
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const buttonColor = isButtonPressed ? colors.base5 : colors.base5;

  return (
    <CallControlsButton
      size={variants.iconSizes.lg}
      onPress={() => {
        if (onPressHandler) {
          onPressHandler();
        }
        setIsButtonPressed(!isButtonPressed);
      }}
      color={buttonColor}
      style={flipCameraButton}
    >
      <IconWrapper>
        <Effects color={colors.iconPrimaryDefault} size={22} />
      </IconWrapper>
    </CallControlsButton>
  );
};
