import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CallContent,
  type CallControlProps,
  NoiseCancellationProvider,
  useCall,
  useModeration,
  useTheme,
  useToggleCallRecording,
  BackgroundFiltersProvider,
  useIsInPiPMode,
} from '@stream-io/video-react-native-sdk';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ParticipantsInfoListModal } from './ParticipantsInfoListModal';
import { E2EEKeyNotification } from './E2EEKeyNotification';
import { BottomControls } from './CallControls/BottomControls';
import { MoreActionsDrawer } from './CallControls/MoreActionsButton/MoreActionsDrawer';
import { useOrientation } from '../hooks/useOrientation';
import { FoldAwareCallArea } from './FoldAwareCallArea';
import { FoldAwareTopBar } from '../contexts/FoldAwareBarLayoutContext';
import { useFoldDivision } from '../hooks/useFoldDivision';
import { useLayout } from '../contexts/LayoutContext';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubtitleContainer } from './CallControls/BottomControls/SubtitleContainer';

// Windows shorter than this use the landscape layout (controls on the side).
// Taller windows, such as tablets or a large foldable display, keep the
// stacked layout even when wider than tall.
const LANDSCAPE_LAYOUT_MAX_HEIGHT = 500;

type ActiveCallProps = {
  onHangupCallHandler?: () => void;
  onChatOpenHandler?: () => void;
  onCallEnded: () => void;
};

export const ActiveCall = ({
  onChatOpenHandler,
  onHangupCallHandler,
  onCallEnded,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const call = useCall();
  const styles = useStyles();
  const { selectedLayout, onLayoutSelection } = useLayout();
  const isInPiPMode = useIsInPiPMode();
  const currentOrientation = useOrientation();
  const { height: windowHeight } = useWindowDimensions();
  const isLandscape =
    currentOrientation === 'landscape' &&
    windowHeight < LANDSCAPE_LAYOUT_MAX_HEIGHT;
  // on a foldable, keep the grid split at the hinge
  const hasHinge = !!useFoldDivision();

  const onOpenCallParticipantsInfo = useCallback(() => {
    setIsCallParticipantsVisible(true);
  }, []);

  useEffect(() => {
    return call?.on('call.moderation_warning', (event) => {
      console.log('call.moderation_warning', event);
      Toast.show({
        position: 'bottom',
        type: 'error',
        text1: `Call Moderation Warning`,
        text2: `Message: ${event.message}`,
        bottomOffset: 150,
      });
    });
  }, [call]);

  useModeration({ duration: 10000 });

  useEffect(() => {
    return call?.on('call.ended', (event) => {
      if (event.reason === 'PolicyViolationModeration') {
        Alert.alert(
          'Call Terminated',
          'The video call was terminated due to a policy violation detected during moderation',
        );
      }
      onCallEnded();
    });
  }, [call, onCallEnded]);

  const { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress } =
    useToggleCallRecording();

  const CustomBottomControls = useCallback(
    ({ landscape }: CallControlProps) => {
      return (
        <BottomControls
          landscape={landscape}
          onParticipantInfoPress={onOpenCallParticipantsInfo}
          onChatOpenHandler={onChatOpenHandler}
          toggleCallRecording={toggleCallRecording}
          isCallRecordingInProgress={isCallRecordingInProgress}
          isAwaitingResponse={isAwaitingResponse}
        />
      );
    },
    [
      onChatOpenHandler,
      onOpenCallParticipantsInfo,
      toggleCallRecording,
      isAwaitingResponse,
      isCallRecordingInProgress,
    ],
  );

  // the SDK renders the call controls, so it reports their height for the
  // more-actions drawer to sit on top of
  const [controlsHeight, setControlsHeight] = useState(0);
  const [isMoreActionsVisible, setIsMoreActionsVisible] = useState(false);

  const onLayoutToggleHandler = (newLayout: 'grid' | 'spotlight') => {
    onLayoutSelection(newLayout);
  };

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <BackgroundFiltersProvider>
      <NoiseCancellationProvider>
        <SafeAreaView style={styles.container}>
          <FoldAwareCallArea>
            <FoldAwareTopBar>
              {/* {!isInPiPMode && <CustomTopControls />} */}
              {!isInPiPMode && <E2EEKeyNotification />}
            </FoldAwareTopBar>
            <CallContent
              iOSPiPIncludeLocalParticipantVideo
              // CallControls={CustomBottomControls}
              landscape={isLandscape}
              layout={selectedLayout}
              onControlsHeightChange={setControlsHeight}
              onMorePress={() => setIsMoreActionsVisible((visible) => !visible)}
              onUsersPress={onOpenCallParticipantsInfo}
              onMessageBubblesPress={onChatOpenHandler}
              onHangupPressHandler={onHangupCallHandler}
              onLayoutToggleHandler={onLayoutToggleHandler}
            />
          </FoldAwareCallArea>
          <MoreActionsDrawer
            isVisible={isMoreActionsVisible}
            onClose={() => setIsMoreActionsVisible(false)}
            controlsContainerHeight={controlsHeight}
          />
          <ParticipantsInfoListModal
            isCallParticipantsInfoVisible={isCallParticipantsVisible}
            setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
          />
          {!!controlsHeight && (
            <SubtitleContainer controlsContainerHeight={controlsHeight} />
          )}
        </SafeAreaView>
      </NoiseCancellationProvider>
    </BackgroundFiltersProvider>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreApp,
        },
        callContent: {
          flex: 1,
        },
      }),
    [semantics],
  );
};
