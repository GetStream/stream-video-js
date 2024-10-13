import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import {
  IconWrapper,
  Audio,
} from '@stream-io/video-react-native-sdk/src/icons';

/**
 * The props for the Audio Button in the Call Controls.
 */
export type AudioButtonProps = {
  /**
   * Handler to be called when the audio button is pressed.
   */
  onPressHandler?: () => void;
};

/**
 * A button that can be used to switch audio output options
 * like speaker, headphones, etc.
 */
export const AudioButton = ({ onPressHandler }: AudioButtonProps) => {
  const {
    theme: { colors, audioButton, variants },
  } = useTheme();

  const [isPressed, setIsPressed] = useState(false);
  const buttonColor = isPressed
    ? colors.buttonPrimaryDefault
    : colors.buttonSecondaryDefault;

  return (
    <CallControlsButton
      onPress={() => {
        if (onPressHandler) {
          onPressHandler();
        }
        setIsPressed(!isPressed);
      }}
      style={audioButton}
      color={buttonColor}
    >
      <IconWrapper>
        <Audio color={colors.iconPrimaryDefault} size={variants.iconSizes.md} />
      </IconWrapper>
    </CallControlsButton>
  );
};
