import {
  Call,
  CallingState,
  StreamCall,
  useCallStateHooks,
  useLoopbackRecording,
  useStreamVideoClient,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { randomId } from '../../modules/helpers/randomId';
import { appTheme } from '../../theme';
import { LoopbackPanel } from './LoopbackPanel';
import { PlaybackPanel } from './PlaybackPanel';
import { RecordingControls } from './RecordingControls';

export const TestRecordingScreen = () => {
  const client = useStreamVideoClient();

  const callId = useMemo(() => {
    return 'test_recording_' + randomId();
  }, []);

  const call = useMemo<Call | undefined>(() => {
    if (!client) return undefined;
    return client.call('default', callId);
  }, [client, callId]);

  useEffect(() => {
    if (!call) return;
    // @ts-expect-error expose for debugging
    globalThis.call = call;

    let cancelled = false;
    (async () => {
      try {
        await call.getOrCreate();
        if (cancelled) return;
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
      call.leave().catch(() => {});
    };
  }, [call]);

  if (!call) return null;

  return (
    <StreamCall call={call}>
      <TestRecordingContent call={call} />
    </StreamCall>
  );
};

const TestRecordingContent = ({ call }: { call: Call }) => {
  const styles = useStyles();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const {
    startRecording,
    stopRecording,
    clearRecordings,
    recordingState,
    loopbackVideoStream,
    loopbackAudioStream,
  } = useLoopbackRecording();

  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    setError(null);
    setRecordingUri(null);

    try {
      await call.join({ create: true, selfSubEnabled: true });
      const uri = await startRecording();
      setRecordingUri(uri);
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      call.leave().catch(() => {});
    }
  }, [call, startRecording]);

  const isConnecting =
    (callingState === CallingState.JOINING ||
      callingState === CallingState.JOINED) &&
    recordingState !== 'recording' &&
    !recordingUri;

  const buttonLabel = useMemo(() => {
    if (isConnecting) return 'Connecting…';
    if (recordingState === 'idle' && recordingUri) return 'Complete';
    if (recordingState === 'recording') return 'Stop recording';
    return 'Record loopback';
  }, [recordingState, isConnecting, recordingUri]);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {recordingState === 'idle' && recordingUri ? (
        <PlaybackPanel uri={recordingUri} />
      ) : (
        <LoopbackPanel
          loopbackVideoStream={loopbackVideoStream}
          loopbackAudioStream={loopbackAudioStream}
        />
      )}
      <RecordingControls
        buttonLabel={buttonLabel}
        recordingState={recordingState}
        recordingUri={recordingUri}
        isConnecting={isConnecting}
        onStart={runTest}
        stopRecording={stopRecording}
        clearRecordings={clearRecordings}
      />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: appTheme.spacing.md,
          gap: appTheme.spacing.md,
          backgroundColor: theme.colors.sheetPrimary,
        },
        error: {
          color: appTheme.colors.error,
          marginBottom: appTheme.spacing.md,
        },
      }),
    [theme],
  );
};
