import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  useIsAudioConnecting,
  useIsVideoConnecting,
  ParticipantLabel,
  type ParticipantLabelProps,
  useTheme,
} from '@stream-io/video-react-native-sdk';

export const ConnectingParticipantLabel = (props: ParticipantLabelProps) => {
  const { participant, trackType } = props;
  const { theme } = useTheme();
  const isScreenShare = trackType === 'screenShareTrack';
  const isAudioConnecting = useIsAudioConnecting(participant) && !isScreenShare;
  const isVideoConnecting = useIsVideoConnecting(participant) && !isScreenShare;

  let connectingText: string | undefined;
  if (isAudioConnecting && isVideoConnecting) {
    connectingText = 'Connecting…';
  } else if (isAudioConnecting) {
    connectingText = 'Connecting to audio…';
  } else if (isVideoConnecting) {
    connectingText = 'Connecting to video…';
  }

  return (
    <View>
      <ParticipantLabel {...props} />
      {connectingText && (
        <View
          style={[styles.badge, { backgroundColor: theme.colors.sheetOverlay }]}
        >
          <ActivityIndicator size="small" color={theme.colors.iconPrimary} />
          <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
            {connectingText}
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
