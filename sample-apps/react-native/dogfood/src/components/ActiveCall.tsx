import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CallContent,
  callManager,
  NoiseCancellationProvider,
  useBackgroundFilters,
  useCall,
  useCallStateHooks,
  useIsInPiPMode,
  useTheme,
  useToggleCallRecording,
} from '@stream-io/video-react-native-sdk';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import { BottomControls } from './CallControlls/BottomControls';
import { useOrientation } from '../hooks/useOrientation';
import { Z_INDEX } from '../constants';
import { TopControls } from './CallControlls/TopControls';
import { useLayout } from '../contexts/LayoutContext';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';
import { ClosedCaptions } from './ClosedCaptions';

type ActiveCallProps = {
  onHangupCallHandler?: () => void;
  onCallEnded: () => void;
  onChatOpenHandler: () => void;
  unreadCountIndicator: number;
};

export const ActiveCall = ({
  onChatOpenHandler,
  onHangupCallHandler,
  onCallEnded,
  unreadCountIndicator,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const call = useCall();
  const styles = useStyles();
  const { selectedLayout } = useLayout();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const isInPiPMode = useIsInPiPMode();
  const currentOrientation = useOrientation();
  const isTablet = DeviceInfo.isTablet();
  const isLandscape = !isTablet && currentOrientation === 'landscape';
  const { applyVideoBlurFilter, disableAllFilters } = useBackgroundFilters();
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  useEffect(() => {
    callManager.start();
    return () => {
      callManager.stop();
    };
  }, []);

  useEffect(() => {
    const unsub = call?.on('call.moderation_blur', () => {
      applyVideoBlurFilter('heavy');
      clearTimeout(blurTimeoutRef.current);

      blurTimeoutRef.current = setTimeout(() => {
        disableAllFilters();
        blurTimeoutRef.current = undefined;
      }, 10000);
    });
    return () => {
      unsub?.();
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = undefined;
      }
      disableAllFilters();
    };
  }, [call, applyVideoBlurFilter, disableAllFilters]);

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
  const { useIsCallCaptioningInProgress } = useCallStateHooks();
  const isCaptioningInProgress = useIsCallCaptioningInProgress();

  const CustomBottomControls = useCallback(() => {
    return (
      <>
        {isCaptioningInProgress && <ClosedCaptions />}
        <BottomControls
          onParticipantInfoPress={onOpenCallParticipantsInfo}
          onChatOpenHandler={onChatOpenHandler}
          unreadCountIndicator={unreadCountIndicator}
          toggleCallRecording={toggleCallRecording}
          isCallRecordingInProgress={isCallRecordingInProgress}
          isAwaitingResponse={isAwaitingResponse}
        />
      </>
    );
  }, [
    onChatOpenHandler,
    onOpenCallParticipantsInfo,
    unreadCountIndicator,
    toggleCallRecording,
    isAwaitingResponse,
    isCallRecordingInProgress,
    isCaptioningInProgress,
  ]);

  const CustomTopControls = useCallback(() => {
    return (
      <TopControls
        isAwaitingResponse={isAwaitingResponse}
        isCallRecordingInProgress={isCallRecordingInProgress}
        onHangupCallHandler={onHangupCallHandler}
      />
    );
  }, [isAwaitingResponse, isCallRecordingInProgress, onHangupCallHandler]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <NoiseCancellationProvider>
      <View style={styles.container}>
        <StatusBar
          barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
        />
        {!isInPiPMode && <CustomTopControls />}
        <CallContent
          iOSPiPIncludeLocalParticipantVideo
          onHangupCallHandler={onHangupCallHandler}
          CallControls={CustomBottomControls}
          landscape={isLandscape}
          layout={selectedLayout}
        />
        <ParticipantsInfoList
          isCallParticipantsInfoVisible={isCallParticipantsVisible}
          setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
        />
      </View>
    </NoiseCancellationProvider>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingTop: theme.variants.insets.top,
          backgroundColor: theme.colors.sheetPrimary,
        },
        callContent: { flex: 1 },
        topUnsafeArea: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: theme.variants.insets.top,
          backgroundColor: theme.colors.sheetPrimary,
          zIndex: Z_INDEX.IN_FRONT,
        },
        bottomUnsafeArea: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: theme.variants.insets.bottom,
          backgroundColor: theme.colors.sheetPrimary,
        },
        leftUnsafeArea: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: theme.variants.insets.left,
          backgroundColor: theme.colors.sheetPrimary,
        },
        rightUnsafeArea: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: theme.variants.insets.right,
          backgroundColor: theme.colors.sheetPrimary,
        },
        view: {
          ...StyleSheet.absoluteFillObject,
          zIndex: Z_INDEX.IN_FRONT,
        },
      }),
    [theme],
  );
};
