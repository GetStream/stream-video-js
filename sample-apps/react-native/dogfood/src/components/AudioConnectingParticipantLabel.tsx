import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  useIsAudioConnecting,
  ParticipantLabel,
  type ParticipantLabelProps,
  useTheme,
} from '@stream-io/video-react-native-sdk';

export const AudioConnectingParticipantLabel = (
  props: ParticipantLabelProps,
) => {
  const { participant, trackType } = props;
  const { theme } = useTheme();
  const isAudioConnecting =
    useIsAudioConnecting(participant) && trackType !== 'screenShareTrack';

  return (
    <View>
      <ParticipantLabel {...props} />
      {isAudioConnecting && (
        <View
          style={[styles.badge, { backgroundColor: theme.colors.sheetOverlay }]}
        >
          <ActivityIndicator size="small" color={theme.colors.iconPrimary} />
          <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
            Connecting to audio…
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderRadius: 6,
  },
  text: { marginLeft: 6, fontSize: 12, fontWeight: '500' },
});
