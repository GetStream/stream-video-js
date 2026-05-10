import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LoopbackRecordingState } from '@stream-io/video-react-native-sdk';
import { appTheme } from '../../theme';
import { useAppGlobalStoreSetState } from '../../contexts/AppContext';
import { SourcePickers } from './SourcePickers';

type RecordingControlsProps = {
  recordingState: LoopbackRecordingState;
  recordingUri: string | null;
  onStart: () => void;
  stopRecording: () => Promise<void>;
  clearRecordings: () => Promise<void>;
};

export const RecordingControls = ({
  recordingState,
  recordingUri,
  onStart,
  stopRecording,
  clearRecordings,
}: RecordingControlsProps) => {
  const styles = useStyles();
  const appSet = useAppGlobalStoreSetState();

  const isComplete = recordingState === 'idle' && !!recordingUri;

  const handlePress = () => {
    if (isComplete) {
      clearRecordings().catch(() => {});
      appSet({ appMode: 'None' });
      return;
    }

    if (recordingState === 'idle') {
      onStart();
    } else if (recordingState === 'recording') {
      stopRecording().catch(() => {});
    }
  };

  const buttonLabel = useMemo(() => {
    if (isComplete) return 'Complete';

    switch (recordingState) {
      case 'idle':
        return 'Record loopback';
      case 'awaiting-streams':
        return 'Starting recording…';
      case 'recording':
        return 'Stop recording';
    }
  }, [recordingState, isComplete]);

  const disabled =
    !isComplete && recordingState !== 'idle' && recordingState !== 'recording';

  return (
    <View style={styles.recordingContainer}>
      {isComplete ? null : (
        <SourcePickers disabled={recordingState === 'recording'} />
      )}
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
          paddingVertical: appTheme.spacing.md,
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
