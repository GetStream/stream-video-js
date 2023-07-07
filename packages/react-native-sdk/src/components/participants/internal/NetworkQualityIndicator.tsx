import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { theme } from '../../../theme';
import { SfuModels } from '@stream-io/video-client';
import React from 'react';
/**
 * Props to be passed for the NetworkQualityIndicator component.
 */
export type NetworkQualityIndicatorType = {
  connectionQuality: SfuModels.ConnectionQuality;
};

const connectionQualitySignalColors: Record<
  SfuModels.ConnectionQuality,
  string[]
> = {
  0: [
    theme.light.static_white,
    theme.light.static_white,
    theme.light.static_white,
  ],
  1: [theme.light.error, theme.light.static_white, theme.light.static_white],
  2: [theme.light.primary, theme.light.primary, theme.light.static_white],
  3: [theme.light.primary, theme.light.primary, theme.light.primary],
};

export const NetworkQualityIndicator = ({
  connectionQuality,
}: NetworkQualityIndicatorType) => {
  if (!connectionQuality) {
    return null;
  }

  const connectionQualityColors =
    connectionQualitySignalColors[connectionQuality];

  return (
    <View style={[styles.container, theme.icon.lg]}>
      <Svg viewBox="0 0 34 34" fill={'none'}>
        <Path
          d="M 9.97559 22.3379 L 9.97559 19.616"
          stroke={connectionQualityColors[0]}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={connectionQualityColors[0]}
        />
        <Path
          d="M 16.7808 22.3379 L 16.7808 15.5331"
          stroke={connectionQualityColors[1]}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={connectionQualityColors[1]}
        />
        <Path
          d="M 23.5854 22.3379 L 23.5854 11.4502"
          stroke={connectionQualityColors[2]}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={connectionQualityColors[2]}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.light.static_overlay,
    borderRadius: theme.rounded.xs,
  },
});
