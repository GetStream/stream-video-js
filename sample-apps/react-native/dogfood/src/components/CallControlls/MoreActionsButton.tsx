import React, { useState } from 'react';
import {
  CallControlsButton,
  useCall,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import MoreActions from '../../assets/MoreActions';
import { BottomControlsDrawer, DrawerOption } from '../BottomControlsDrawer';
import Stats from '../../assets/Stats';
import Feedback from '../../assets/Feedback';
import FeedbackModal from '../FeedbackModal';

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
    theme: { colors, variants, moreActionsButton, defaults },
  } = useTheme();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const call = useCall();

  const handleRating = async (rating: number) => {
    await call
      ?.submitFeedback(Math.min(Math.max(1, rating), 5), {
        reason: '<no-message-provided>',
      })
      .catch((err) => console.warn(`Failed to submit call feedback`, err));

    setFeedbackModalVisible(false);
  };

  const options: DrawerOption[] = [
    {
      id: '1',
      label: 'Stats',
      icon: (
        <IconWrapper>
          <Stats
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => {},
    },
    {
      id: '2',
      label: 'Feedback',
      icon: (
        <IconWrapper>
          <Feedback
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        setIsDrawerVisible(false);
        setFeedbackModalVisible(true);
      },
    },
  ];

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
      <BottomControlsDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        options={options}
      />
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onRating={handleRating}
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
