import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { SfuModels } from '@stream-io/video-client';
import React from 'react';
import { Z_INDEX } from '../../../constants';
import { type ParticipantViewProps } from './ParticipantView';
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
    theme: { semantics },
  } = useTheme();
  const { connectionQuality } = participant;
  if (!connectionQuality) {
    return null;
  }

  //TODO: update tokens
  switch (connectionQuality) {
    case SfuModels.ConnectionQuality.EXCELLENT:
      return [
        semantics.accentSuccess,
        semantics.accentSuccess,
        semantics.accentSuccess,
      ];
    case SfuModels.ConnectionQuality.GOOD:
      return [
        semantics.accentWarning,
        semantics.accentWarning,
        semantics.textOnAccent,
      ];
    case SfuModels.ConnectionQuality.POOR:
      return [
        semantics.accentError,
        semantics.textOnAccent,
        semantics.textOnAccent,
      ];
    default:
      return null;
  }
};

export const ParticipantNetworkQualityIndicator = ({
  participant,
}: ParticipantNetworkQualityIndicatorProps) => {
  const {
    theme: { participantNetworkQualityIndicator },
  } = useTheme();
  const connectionQualityColors = useConnectionQualitySignalColors(participant);

  if (!connectionQualityColors) {
    return null;
  }
  return (
    <View
      style={[styles.container, participantNetworkQualityIndicator.container]}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24" fill={'none'}>
        <Path
          d="M12 16L12 11"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={connectionQualityColors[0]}
          fill={connectionQualityColors[0]}
        />
        <Path
          d="M7 16L7 14"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={connectionQualityColors[1]}
          fill={connectionQualityColors[1]}
        />
        <Path
          d="M17 16L17 8"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={connectionQualityColors[2]}
          fill={connectionQualityColors[2]}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: Z_INDEX.IN_FRONT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
