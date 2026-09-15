import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LoopbackRecordingState } from '@stream-io/video-react-native-sdk';
import { useTheme } from '@stream-io/video-react-native-sdk/src/contexts/ThemeContext';

type RecordingControlsProps = {
  buttonLabel: string;
  recordingState: LoopbackRecordingState;
  isConnecting: boolean;
  onStart: () => void;
  stopRecording: () => Promise<void>;
};

export const RecordingControls = ({
  buttonLabel,
  recordingState,
  isConnecting,
  onStart,
  stopRecording,
}: RecordingControlsProps) => {
  const styles = useStyles();

  const handlePress = () => {
    if (recordingState === 'idle' && !isConnecting) {
      onStart();
    } else {
      stopRecording().catch(() => {});
    }
  };

  const disabled = isConnecting;

  return (
    <View style={styles.recordingContainer}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.recordButton,
          recordingState === 'recording' && styles.recordButtonActive,
          disabled && styles.recordButtonDisabled,
          pressed && !disabled && styles.recordButtonPressed,
        ]}
      >
        <Text style={styles.recordButtonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics, button },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        recordingContainer: {
          flexDirection: 'row',
          gap: primitives.spacingSm,
          alignItems: 'stretch',
        },
        recordButton: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          ...button.container,
          ...button.primary.container,
          ...button.large,
        },
        recordButtonActive: {
          backgroundColor: semantics.accentError,
        },
        recordButtonDisabled: {
          opacity: 0.5,
        },
        recordButtonPressed: {
          opacity: 0.8,
        },
        recordButtonText: {
          ...button.primary.text,
        },
      }),
    [primitives, semantics, button],
  );
};
