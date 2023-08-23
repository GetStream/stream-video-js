import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { SfuModels } from '@stream-io/video-client';
import React from 'react';
import { Z_INDEX } from '../../../constants';
import { ParticipantViewProps } from './ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the NetworkQualityIndicator component.
 */
export type ParticipantNetworkQualityIndicatorProps = Pick<
  ParticipantViewProps,
  'participant'
>;

const useConnectionQualitySignalColors = (
  participant: ParticipantViewProps['participant'],
) => {
  const {
    theme: { colors },
  } = useTheme();
  const { connectionQuality } = participant;
  if (!connectionQuality) {
    return null;
  }

  switch (connectionQuality) {
    case SfuModels.ConnectionQuality.EXCELLENT:
      return [colors.primary, colors.primary, colors.primary];
    case SfuModels.ConnectionQuality.GOOD:
      return [colors.primary, colors.primary, colors.static_white];
    case SfuModels.ConnectionQuality.POOR:
      return [colors.error, colors.static_white, colors.static_white];
    default:
      return null;
  }
};

export const ParticipantNetworkQualityIndicator = ({
  participant,
}: ParticipantNetworkQualityIndicatorProps) => {
  const {
    theme: {
      colors,
      variants: { iconSizes },
      participantNetworkQualityIndicator,
    },
  } = useTheme();
  const connectionQualityColors = useConnectionQualitySignalColors(participant);

  if (!connectionQualityColors) {
    return null;
  }
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.static_overlay,
          height: iconSizes.lg,
          width: iconSizes.lg,
        },
        participantNetworkQualityIndicator.container,
      ]}
    >
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
    zIndex: Z_INDEX.IN_FRONT,
    alignSelf: 'flex-end',
    borderRadius: 5,
  },
});
