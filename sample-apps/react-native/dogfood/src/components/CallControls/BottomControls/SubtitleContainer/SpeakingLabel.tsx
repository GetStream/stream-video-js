import { useMemo } from 'react';
import { useCallStateHooks, useTheme } from '@stream-io/video-react-native-sdk';
import { StyleSheet, Text, View } from 'react-native';

export const SpeakingLabel = () => {
  const styles = useStyles();
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();

  if (!isSpeakingWhileMuted) {
    return null;
  }
  return (
    <View style={styles.speakingLabelContainer}>
      <Text style={styles.label}>{'You are muted. Unmute to speak.'}</Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        speakingLabelContainer: {
          backgroundColor: theme.colors.sheetPrimary,
        },
        label: {
          textAlign: 'center',
          color: theme.colors.textPrimary,
        },
      }),
    [theme],
  );
};
