import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CallContent,
  NoiseCancellationProvider,
  useCall,
  useModeration,
  useTheme,
  useToggleCallRecording,
  BackgroundFiltersProvider,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, Alert, StatusBar, StyleSheet } from 'react-native';
import { ParticipantsInfoListModal } from './ParticipantsInfoListModal';
import { BottomControls } from './CallControls/BottomControls';
import { MoreActionsDrawer } from './CallControls/MoreActionsButton/MoreActionsDrawer';
import { useOrientation } from '../hooks/useOrientation';
import { useLayout } from '../contexts/LayoutContext';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const currentOrientation = useOrientation();
  const isTablet = DeviceInfo.isTablet();
  const isLandscape = !isTablet && currentOrientation === 'landscape';

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

  const CustomBottomControls = useCallback(() => {
    return (
      <BottomControls
        onParticipantInfoPress={onOpenCallParticipantsInfo}
        onChatOpenHandler={onChatOpenHandler}
        toggleCallRecording={toggleCallRecording}
        isCallRecordingInProgress={isCallRecordingInProgress}
        isAwaitingResponse={isAwaitingResponse}
      />
    );
  }, [
    onChatOpenHandler,
    onOpenCallParticipantsInfo,
    toggleCallRecording,
    isAwaitingResponse,
    isCallRecordingInProgress,
  ]);

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
          <StatusBar
            barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
          />
          {/* {!isInPiPMode && <CustomTopControls />} */}
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
          <MoreActionsDrawer
            isVisible={isMoreActionsVisible}
            onClose={() => setIsMoreActionsVisible(false)}
            controlsContainerHeight={controlsHeight}
          />
          <ParticipantsInfoListModal
            isCallParticipantsInfoVisible={isCallParticipantsVisible}
            setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
          />
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
        callContent: { flex: 1 },
      }),
    [semantics],
  );
};
