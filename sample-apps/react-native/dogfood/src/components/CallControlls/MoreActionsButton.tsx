import React, { useEffect, useRef, useState } from 'react';
import {
  CallControlsButton,
  OwnCapability,
  useCall,
  useCallStateHooks,
  useTheme,
  useScreenshot,
} from '@stream-io/video-react-native-sdk';
import { Text, Modal, Image, TouchableOpacity } from 'react-native';
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
import Screenshot from '../../assets/Screenshot';
import Hearing from '../../assets/Hearing';
import {
  isNoiseCancellationEnabled,
  setNoiseCancellationEnabled,
} from '@stream-io/noise-cancellation-react-native';
import { View, Alert, StyleSheet } from 'react-native';

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
  const [isNoiseCancelEnabled, setIsNoiseCancelEnabled] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [showCallStats, setShowCallStats] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const setState = useAppGlobalStoreSetState();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const call = useCall();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    useIsCallCaptioningInProgress,
    useHasPermissions,
    useParticipants,
    useDominantSpeaker,
  } = useCallStateHooks();
  const isCaptioningInProgress = useIsCallCaptioningInProgress();
  const canToggle = useHasPermissions(
    OwnCapability.START_CLOSED_CAPTIONS_CALL,
    OwnCapability.STOP_CLOSED_CAPTIONS_CALL,
  );
  const dominantSpeaker = useDominantSpeaker();
  const { takeScreenshot } = useScreenshot();
  const participants = useParticipants();

  useEffect(() => {
    const fetchNoiseCancellationStatus = async () => {
      const isEnabled = await isNoiseCancellationEnabled();
      setNoiseCancellationEnabled(isEnabled);
    };
    fetchNoiseCancellationStatus();
  }, []);

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

  const toggleNoiseCancellation = async () => {
    setIsNoiseCancelEnabled((prev) => {
      setNoiseCancellationEnabled(!prev);
      return !prev;
    });
  };

  const getScreenshotOfDominantSpeaker = async () => {
    let speaker = dominantSpeaker;
    if (!speaker) {
      speaker = participants[0];
    }
    // Use dominant speaker or fallback to first participant
    if (!speaker) {
      Alert.alert('Error', 'No active participant to screenshot');
      return;
    }

    // Take the snapshot
    const base64Image = await takeScreenshot(speaker, 'videoTrack');

    if (!base64Image) {
      Alert.alert('Error', 'Failed to capture screenshot');
      return;
    }

    // Store the screenshot and show the modal
    setScreenshotImage(base64Image);
    setScreenshotModalVisible(true);
    setIsDrawerVisible(false);

    return base64Image;
  };

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
    {
      id: '4',
      label: 'Take Screenshot',
      icon: (
        <IconWrapper>
          <Screenshot
            color={colors.iconPrimary}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: getScreenshotOfDominantSpeaker,
    },
    {
      id: '5',
      label: isNoiseCancelEnabled
        ? 'Disable noise cancellation'
        : 'Enable noise cancellation',
      icon: (
        <IconWrapper>
          <Hearing
            color={colors.iconPrimary}
            size={variants.roundButtonSizes.sm}
          />
        </IconWrapper>
      ),
      onPress: toggleNoiseCancellation,
    },
    ...(canToggle
      ? [
          {
            id: '6',
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

      {/* Screenshot Preview Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={screenshotModalVisible}
        onRequestClose={() => setScreenshotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setScreenshotModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {screenshotImage && (
              <Image
                source={{ uri: `data:image/png;base64,${screenshotImage}` }}
                style={styles.screenshotImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
      <IconWrapper>
        <MoreActions color={colors.iconPrimary} size={defaults.iconSize} />
      </IconWrapper>
    </CallControlsButton>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    height: '60%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
});
