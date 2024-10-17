import React, { useState } from 'react';
import { Grid } from '@stream-io/video-react-native-sdk/src/icons/Grid';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';

export type LayoutSwitcherButtonProps = {
  /**
   * Handler to be called when the layout switcher button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * The layout switcher Button can be used to switch different layout arrangements
 * of the call participants.
 */
export const LayoutSwitcherButton = ({
  onPressHandler,
}: LayoutSwitcherButtonProps) => {
  const {
    theme: { colors, defaults, variants },
  } = useTheme();
  const [toggleLayoutMenu, setToggleLayoutMenu] = useState(false);
  const buttonColor = toggleLayoutMenu
    ? colors.iconPrimaryAccent
    : colors.iconPrimaryDefault;

  return (
    <CallControlsButton
      size={variants.iconSizes.lg}
      onPress={() => {
        if (onPressHandler) {
          onPressHandler();
        }
        setToggleLayoutMenu(!toggleLayoutMenu);
      }}
      color={colors.sheetPrimary}
    >
      <IconWrapper>
        <Grid color={buttonColor} size={defaults.iconSize} />
      </IconWrapper>
    </CallControlsButton>
  );
};
