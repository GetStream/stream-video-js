import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import MoreActions from '../../assets/MoreActions';
import { Drawer, DrawerOption } from '../Drawer';
import NoiseCancelation from '../../assets/NoiseCancelation';
import ClosedCaptions from '../../assets/ClosedCaptions';
import Stats from '../../assets/Stats';
import Feedback from '../../assets/Feedback';

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
    theme: { colors, moreActionsButton, defaults, variants },
  } = useTheme();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const options: DrawerOption[] = [
    {
      id: '2',
      label: 'Noise Cancellation On',
      icon: (
        <IconWrapper>
          <NoiseCancelation
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => console.log('Noise Cancellation'),
    },
    {
      id: '3',
      label: 'Start Closed Captions',
      icon: (
        <IconWrapper>
          <ClosedCaptions
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => console.log('Closed Captions'),
    },
    {
      id: '4',
      label: 'Stats',
      icon: (
        <IconWrapper>
          <Stats
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => console.log('Stats'),
    },
    {
      id: '5',
      label: 'Feedback',
      icon: (
        <IconWrapper>
          <Feedback
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => console.log('Feedback'),
    },
  ];

  const buttonColor = isDrawerVisible
    ? colors.buttonPrimaryDefault
    : colors.buttonSecondaryDefault;

  return (
    <CallControlsButton
      onPress={() => {
        if (onPressHandler) {
          onPressHandler();
        }
        setIsDrawerVisible(!isDrawerVisible);
      }}
      style={moreActionsButton}
      color={buttonColor}
    >
      <Drawer
        // isVisible={true}
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        options={options}
      />
      <IconWrapper>
        <MoreActions
          color={colors.iconPrimaryDefault}
          size={defaults.iconSize}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
