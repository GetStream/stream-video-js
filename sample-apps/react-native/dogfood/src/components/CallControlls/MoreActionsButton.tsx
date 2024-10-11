import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper, More } from '@stream-io/video-react-native-sdk/src/icons';

/**
 * The props for the More Actions Button in the Call Controls.
 */
export type MoreActionsButtonProps = {
  /**
   * Handler to be called when the more actions button is pressed.
   */
  onPressHandler?: () => void;
};

/**
 * A button that can be used to toggle the visibility
 * of a menu or bottom sheet with more actions.
 *
 */
export const MoreActionsButton = ({
  onPressHandler,
}: MoreActionsButtonProps) => {
  const {
    theme: { colors, moreActionsButton, defaults },
  } = useTheme();

  const [isPressed, setIsPressed] = useState(false);
  const buttonColor = isPressed
    ? colors.buttonPrimaryDefault
    : colors.buttonSecondaryDefault;

  return (
    <CallControlsButton
      onPress={() => {
        // TODO: Implement PBE-5870 [Demo App] Component for "More" menu items
        if (onPressHandler) {
          onPressHandler();
        }
        setIsPressed(!isPressed);
      }}
      style={moreActionsButton}
      color={buttonColor}
    >
      <IconWrapper>
        <More color={colors.iconPrimaryDefault} size={defaults.iconSize} />
      </IconWrapper>
    </CallControlsButton>
  );
};
