import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { TopViewBackground } from '@stream-io/video-react-native-sdk/src/icons';
import {
  HangUpCallButton,
  useTheme,
  ToggleCameraFaceButton,
} from '@stream-io/video-react-native-sdk';
import { CallStatusBadge } from './CallStatusBadge';
import { VideoEffectsButton } from '../VideoEffectsButton';
import { LayoutSwitcherButton } from './LayoutSwitcherButton';
import { useOrientation } from '../../hooks/useOrientation';

export type TopControlsProps = {
  onHangupCallHandler?: () => void;
  isCallRecordingInProgress: boolean;
  isAwaitingResponse: boolean;
};

export const TopControls = ({
  onHangupCallHandler,
  isCallRecordingInProgress,
  isAwaitingResponse,
}: TopControlsProps) => {
  const [topControlsHeight, setTopControlsHeight] = useState<number>(0);
  const [topControlsWidth, setTopControlsWidth] = useState<number>(0);
  const styles = useStyles();
  const { theme } = useTheme();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height, width } = event.nativeEvent.layout;
    if (setTopControlsHeight) {
      setTopControlsHeight(height);
      setTopControlsWidth(width);
    }
  };

  return (
    <View>
      {/* Component for the background of the TopControls. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground height={topControlsHeight} width={topControlsWidth} />
      <View style={styles.content} onLayout={onLayout}>
        <View style={styles.leftElement}>
          <View style={styles.leftContent}>
            <LayoutSwitcherButton />
            <ToggleCameraFaceButton
              backgroundColor={theme.colors.sheetPrimary}
            />
            {(!isAwaitingResponse || isLandscape) && <VideoEffectsButton />}
          </View>
        </View>
        <View style={styles.centerElement}>
          <CallStatusBadge
            isCallRecordingInProgress={isCallRecordingInProgress}
            isAwaitingResponse={isAwaitingResponse}
          />
        </View>
        <View style={styles.rightElement}>
          <HangUpCallButton onPressHandler={onHangupCallHandler} />
        </View>
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        content: {
          position: 'absolute',
          backgroundColor: theme.colors.sheetPrimary,
          top: 0,
          flexDirection: 'row',
          paddingVertical: 2,
          paddingHorizontal: theme.variants.spacingSizes.md,
          alignItems: 'center',
        },
        leftElement: {
          flex: 1,
          alignItems: 'flex-start',
        },
        leftContent: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        centerElement: {
          flex: 1,
          alignItems: 'center',
        },
        rightElement: {
          flex: 1,
          alignItems: 'flex-end',
        },
      }),
    [theme],
  );
};
