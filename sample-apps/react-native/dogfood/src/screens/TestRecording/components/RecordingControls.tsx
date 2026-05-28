import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LoopbackRecordingState } from '@stream-io/video-react-native-sdk';
import { appTheme } from '../../../theme';
import { SourcePickers } from './SourcePickers';

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
      <SourcePickers
        disabled={isConnecting || recordingState === 'recording'}
      />
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
  return useMemo(
    () =>
      StyleSheet.create({
        recordingContainer: {
          flexDirection: 'row',
          gap: appTheme.spacing.sm,
          alignItems: 'stretch',
        },
        recordButton: {
          flex: 1,
          backgroundColor: appTheme.colors.primary,
          borderRadius: 8,
          paddingVertical: appTheme.spacing.lg,
          justifyContent: 'center',
          alignItems: 'center',
        },
        recordButtonActive: {
          backgroundColor: appTheme.colors.error,
        },
        recordButtonDisabled: {
          opacity: 0.5,
        },
        recordButtonPressed: {
          opacity: 0.8,
        },
        recordButtonText: {
          color: appTheme.colors.static_white,
          fontWeight: '600',
          fontSize: 14,
        },
      }),
    [],
  );
};
