import React, { useEffect, useRef, useState } from 'react';
import {
  OwnCapability,
  useCall,
  useCallStateHooks,
  useNoiseCancellation,
  useScreenshot,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { BottomControlsDrawer, DrawerOption } from './BottomControlsDrawer';
import Feedback from '../../../assets/Feedback';
import FeedbackModal from '../../FeedbackModal';
import {
  ThemeMode,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../../contexts/AppContext';
import LightDark from '../../../assets/LightDark';
import Stats from '../../../assets/Stats';
import ClosedCaptions from '../../../assets/ClosedCaptions';
import Screenshot from '../../../assets/Screenshot';
import Hearing from '../../../assets/Hearing';
import { AudioOutput } from '../../../assets/AudioOutput';
import { AudioRoutePickerDrawer } from './AudioRoutePickerDrawer';

/**
 * The props for the More Actions drawer.
 */
type MoreActionsDrawerProps = {
  /**
   * Whether the drawer is open.
   */
  isVisible: boolean;
  /**
   * Called when the drawer dismisses itself (backdrop, swipe) or an option
   * closes it.
   */
  onClose: () => void;
  /**
   * The height of the call controls, used to position the drawer above them.
   */
  controlsContainerHeight: number;
};

/**
 * The more-actions drawer and the surfaces it opens: call stats, feedback,
 * screenshot preview and the audio route picker.
 *
 * The trigger lives elsewhere — the SDK's `CallControls` renders it and reports
 * presses through `onMorePress` — so this component only owns the option list
 * and its own visibility is controlled from the outside.
 */
export const MoreActionsDrawer = ({
  isVisible,
  onClose,
  controlsContainerHeight,
}: MoreActionsDrawerProps) => {
  const {
    theme: { semantics, components },
  } = useTheme();
  const {
    isSupported,
    deviceSupportsAdvancedAudioProcessing,
    isEnabled: isNoiseCancellationEnabled,
    setEnabled: setNoiseCancellationEnabled,
  } = useNoiseCancellation();
  const [isAudioRoutePickerDrawerVisible, setIsAudioRoutePickerDrawerVisible] =
    useState(false);
  const [showCallStats, setShowCallStats] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const setState = useAppGlobalStoreSetState();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const call = useCall();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setNoiseCancellationEnabled((prev) => {
      setNoiseCancellationEnabled(!prev);
      return !prev;
    });
  };

  const showAudioRoutePicker = async () => {
    setIsAudioRoutePickerDrawerVisible(true);
    onClose();
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
    onClose();

    return base64Image;
  };

  const options: DrawerOption[] = [
    {
      id: '1',
      label: 'Feedback',
      icon: (
        <IconWrapper>
          <Feedback
            color={semantics.textPrimary}
            size={components.iconSizeSm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        onClose();
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
          <Stats color={semantics.textPrimary} size={components.iconSizeSm} />
        </IconWrapper>
      ),
      // keeps the drawer open and swaps its content for the stats panel
      onPress: () => {
        setShowCallStats(true);
      },
    },
    {
      id: '3',
      label: getName(themeMode),
      icon: (
        <IconWrapper>
          <LightDark
            color={semantics.textPrimary}
            size={components.iconSizeSm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        if (themeMode === 'light') {
          setState({ themeMode: 'dark' });
        } else {
          setState({ themeMode: 'light' });
        }
        onClose();
      },
    },
    {
      id: '4',
      label: 'Take Screenshot',
      icon: (
        <IconWrapper>
          <Screenshot
            color={semantics.textPrimary}
            size={components.iconSizeSm}
          />
        </IconWrapper>
      ),
      onPress: getScreenshotOfDominantSpeaker,
    },
    {
      id: '5',
      label: 'Show Audio Route Picker',
      icon: (
        <IconWrapper>
          <AudioOutput
            color={semantics.textPrimary}
            size={components.iconSizeSm}
          />
        </IconWrapper>
      ),
      onPress: () => {
        showAudioRoutePicker();
      },
    },
    ...(isSupported && deviceSupportsAdvancedAudioProcessing
      ? [
          {
            id: '6',
            label: isNoiseCancellationEnabled
              ? 'Disable noise cancellation'
              : 'Enable noise cancellation',
            icon: (
              <IconWrapper>
                <Hearing
                  color={semantics.textPrimary}
                  size={components.iconSizeSm}
                />
              </IconWrapper>
            ),
            onPress: toggleNoiseCancellation,
          },
        ]
      : []),
    ...(canToggle
      ? [
          {
            id: '7',
            label: getCaptionsLabel(),
            icon: (
              <IconWrapper>
                <ClosedCaptions
                  color={semantics.textPrimary}
                  size={components.iconSizeSm}
                />
              </IconWrapper>
            ),
            onPress: () => {
              if (isCaptioningInProgress) {
                call?.stopClosedCaptions();
              } else {
                call?.startClosedCaptions();
              }
              onClose();
            },
          },
        ]
      : []),
  ];

  return (
    <>
      {!!controlsContainerHeight && (
        <AudioRoutePickerDrawer
          isVisible={isAudioRoutePickerDrawerVisible}
          bottomControlsHeight={controlsContainerHeight}
          onClose={() => {
            setIsAudioRoutePickerDrawerVisible(false);
          }}
        />
      )}
      {!!controlsContainerHeight && (
        <BottomControlsDrawer
          isVisible={isVisible}
          bottomControlsHeight={controlsContainerHeight}
          onClose={() => {
            setShowCallStats(false);
            onClose();
          }}
          options={options}
          showCallStats={showCallStats}
        />
      )}
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
    </>
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
