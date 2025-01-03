import React, { useEffect, useRef, useState } from 'react';
import {
  CallControlsButton,
  OwnCapability,
  useCall,
  useCallStateHooks,
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
import Stats from '../../assets/Stats';
import ClosedCaptions from '../../assets/ClosedCaptions';

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
  const [showCallStats, setShowCallStats] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const setState = useAppGlobalStoreSetState();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const call = useCall();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { useIsCallCaptioningInProgress, useHasPermissions } =
    useCallStateHooks();
  const isCaptioningInProgress = useIsCallCaptioningInProgress();
  const canToggle = useHasPermissions(
    OwnCapability.START_CLOSED_CAPTIONS_CALL,
    OwnCapability.STOP_CLOSED_CAPTIONS_CALL,
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  const getCaptionsLabel = () =>
    isCaptioningInProgress
      ? 'Disable closed captions'
      : 'Enable closed captions';

  const options: DrawerOption[] = [
    {
      id: '1',
      label: 'Feedback',
      icon: (
        <IconWrapper>
          <Feedback
            color={colors.iconPrimary}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        setIsDrawerVisible(false);
        // delay the modal to show after the drawer closes
        timeoutRef.current = setTimeout(() => {
          setFeedbackModalVisible(true);
        }, 500);
      },
    },
    {
      id: '2',
      label: 'Call stats',
      icon: (
        <IconWrapper>
          <Stats
            color={colors.iconPrimary}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        setShowCallStats(true);
        setIsDrawerVisible(true);
      },
    },
    {
      id: '3',
      label: getName(themeMode),
      icon: (
        <IconWrapper>
          <LightDark
            color={colors.iconPrimary}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        if (themeMode === 'light') {
          setState({ themeMode: 'dark' });
        } else {
          setState({ themeMode: 'light' });
        }
        setIsDrawerVisible(false);
      },
    },
    ...(canToggle
      ? [
          {
            id: '4',
            label: getCaptionsLabel(),
            icon: (
              <IconWrapper>
                <ClosedCaptions
                  color={colors.iconPrimary}
                  size={variants.roundButtonSizes.sm}
                />
              </IconWrapper>
            ),
            onPress: () => {
              if (isCaptioningInProgress) {
                call?.stopClosedCaptions();
              } else {
                call?.startClosedCaptions();
              }
              setIsDrawerVisible(false);
            },
          },
        ]
      : []),
  ];

  const buttonColor = isDrawerVisible
    ? colors.buttonPrimary
    : colors.buttonSecondary;

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
        onClose={() => {
          setShowCallStats(false);
          setIsDrawerVisible(false);
        }}
        options={options}
        showCallStats={showCallStats}
      />
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onRating={handleRating}
      />
      <IconWrapper>
        <MoreActions color={colors.iconPrimary} size={defaults.iconSize} />
      </IconWrapper>
    </CallControlsButton>
  );
};
