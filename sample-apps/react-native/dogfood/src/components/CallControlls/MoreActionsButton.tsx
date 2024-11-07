import React, { useState } from 'react';
import {
  CallControlsButton,
  useCall,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import MoreActions from '../../assets/MoreActions';
import { BottomControlsDrawer, DrawerOption } from '../BottomControlsDrawer';
import Feedback from '../../assets/Feedback';
import FeedbackModal from '../FeedbackModal';
import {
  ThemeMode,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import LightDark from '../../assets/LightDark';

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
  const setState = useAppGlobalStoreSetState();
  const theme = useAppGlobalStoreValue((store) => store.themeMode);
  const call = useCall();

  const handleRating = async (rating: number) => {
    await call
      ?.submitFeedback(Math.min(Math.max(1, rating), 5), {
        reason: '<no-message-provided>',
      })
      .catch((err) => console.warn('Failed to submit call feedback', err));

    setFeedbackModalVisible(false);
  };

  const getName = (theme: ThemeMode) => {
    if (theme === 'light') {
      return 'Dark mode';
    }
    return 'Light mode';
  };

  const options: DrawerOption[] = [
    {
      id: '1',
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
    {
      id: '2',
      label: getName(theme),
      icon: (
        <IconWrapper>
          <LightDark
            color={colors.iconPrimaryDefault}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        if (theme === 'light') {
          setState({ themeMode: 'dark' });
        } else {
          setState({ themeMode: 'light' });
        }
        setIsDrawerVisible(false);
      },
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
