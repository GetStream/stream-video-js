import React, { useState, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { TopViewBackground } from '@stream-io/video-react-native-sdk/src/icons';
import {
  HangUpCallButton,
  useTheme,
  ToggleCameraFaceButton,
} from '@stream-io/video-react-native-sdk';
import { CallStatusBadge } from './CallStatusBadge';
import { VideoEffectsButton } from '../VideoEffectsButton';
import { LayoutSwitcherButton } from './LayoutSwitcherButton';

export type TopControlsProps = {
  /**
   * Handler to be called when the hangup button is pressed in the TopControls.
   * @returns void
   */
  onHangupCallHandler?: () => void;
};

export const TopControls = ({ onHangupCallHandler }: TopControlsProps) => {
  const [topControlsHeight, setTopControlsHeight] = useState<number>(0);
  const [topControlsWidth, setTopControlsWidth] = useState<number>(0);
  const {
    theme: { callTopView },
  } = useTheme();
  const styles = useStyles();

  // TODO: replace this with real data implement PBE-5871 [Demo App] Call Recording flow
  const [isCallRecorded] = useState(false);

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height, width } = event.nativeEvent.layout;
    if (setTopControlsHeight) {
      setTopControlsHeight(height);
      setTopControlsWidth(width);
    }
  };

  return (
    <View style={callTopView.container as StyleProp<ViewStyle>}>
      {/* Component for the background of the TopControls. Since it has a Linear Gradient, an SVG is used to render it. */}
      <TopViewBackground height={topControlsHeight} width={topControlsWidth} />
      <View
        style={[styles.content, callTopView.content as StyleProp<ViewStyle>]}
        onLayout={onLayout}
      >
        <View style={styles.leftElement}>
          <View style={styles.leftContent}>
            <LayoutSwitcherButton onPressHandler={() => {}} />
            <ToggleCameraFaceButton />
            {!isCallRecorded && <VideoEffectsButton />}
          </View>
        </View>
        <View
          style={[
            styles.centerElement,
            callTopView.centerElement as StyleProp<ViewStyle>,
          ]}
        >
          <CallStatusBadge isCallRecorded={isCallRecorded} />
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
