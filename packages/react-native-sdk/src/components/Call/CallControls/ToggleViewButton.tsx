import React, { useState } from 'react';
import { CallControlsButton } from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '../../../icons/IconWrapper';
import { useTheme } from '../../..';
import { Grid } from '../../../icons/Grid';

/**
 * The props for the Flip Camera Button in the camera Controls.
 */
export type ToggleViewButton = {
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
export const ToggleViewButton = ({ onPressHandler }: ToggleViewButton) => {
  const {
    theme: { colors, flipCameraButton, defaults, variants },
  } = useTheme();
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const buttonColor = isCameraFlipped ? colors.base5 : colors.base5;

  return (
    <CallControlsButton
      size={variants.iconSizes.lg}
      onPress={() => {
        if (onPressHandler) {
          onPressHandler();
        }
        setIsCameraFlipped(!isCameraFlipped);
      }}
      color={buttonColor}
      style={flipCameraButton}
    >
      <IconWrapper>
        <Grid color={colors.iconPrimaryDefault} size={22} />
      </IconWrapper>
    </CallControlsButton>
  );
};
