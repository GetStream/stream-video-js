import React, { useEffect, useMemo } from 'react';
import {
  CallContent,
  NoiseCancellationProvider,
  useCall,
  useModeration,
  useTheme,
  BackgroundFiltersProvider,
  useIsInPiPMode,
} from '@stream-io/video-react-native-sdk';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { E2EEKeyNotification } from './E2EEKeyNotification';
import { BottomControls } from './CallControls/BottomControls';
import { CustomTopBar } from './CallControls/TopControls/CustomTopBar';
import { useOrientation } from '../hooks/useOrientation';
import { FoldAwareCallArea } from './FoldAwareCallArea';
import { FoldAwareTopBar } from '../contexts/FoldAwareBarLayoutContext';
import { useFoldDivision } from '../hooks/useFoldDivision';
import { useLayout } from '../contexts/LayoutContext';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

// Windows shorter than this use the landscape layout (controls on the side).
// Taller windows, such as tablets or a large foldable display, keep the
// stacked layout even when wider than tall.
const LANDSCAPE_LAYOUT_MAX_HEIGHT = 500;

type ActiveCallProps = {
  onHangupCallHandler?: () => void;
  onCallEnded: () => void;
};

export const ActiveCall = ({
  onHangupCallHandler,
  onCallEnded,
}: ActiveCallProps) => {
  const call = useCall();
  const styles = useStyles();
  const { selectedLayout } = useLayout();
  const isInPiPMode = useIsInPiPMode();
  const currentOrientation = useOrientation();
  const { height: windowHeight } = useWindowDimensions();
  const isLandscape =
    currentOrientation === 'landscape' &&
    windowHeight < LANDSCAPE_LAYOUT_MAX_HEIGHT;
  // on a foldable, keep the grid split at the hinge
  const hasHinge = !!useFoldDivision();

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
              CallAppBar={CustomTopBar}
              CallControls={BottomControls}
              landscape={isLandscape}
              layout={selectedLayout}
              evenGridColumns={hasHinge}
              onHangupPressHandler={onHangupCallHandler}
            />
          </FoldAwareCallArea>
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
