import {
  Call,
  CallingState,
  StreamCall,
  useCall,
  useCallStateHooks,
  useLoopbackRecording,
  useStreamVideoClient,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TestRecordingStackParamList } from '../../../types';
import { randomId } from '../../modules/helpers/randomId';
import { appTheme } from '../../theme';
import {
  LoopbackPanel,
  RecordingControls,
  InlineCallStats,
} from './components';

type Props = NativeStackScreenProps<
  TestRecordingStackParamList,
  'TestRecordingScreen'
>;

export const TestRecordingScreen = ({ navigation }: Props) => {
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
      <TestRecordingContent navigation={navigation} />
    </StreamCall>
  );
};

const TestRecordingContent = ({
  navigation,
}: {
  navigation: Props['navigation'];
}) => {
  const styles = useStyles();
  const call = useCall();
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

  const [error, setError] = useState<string | null>(null);

  // Clear any prior recording left on disk when the screen mounts so each
  // run starts fresh (e.g. when returning from the results screen).
  useEffect(() => {
    clearRecordings().catch(() => {});
  }, [clearRecordings]);

  const runTest = useCallback(async () => {
    setError(null);

    try {
      if (!call) return;

      call.setStatsReportingIntervalInMs(500);
      await call.join({ create: true, selfSubEnabled: true });
      const uri = await startRecording();
      if (!uri) return;
      navigation.replace('TestRecordingResults', { uri });
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      call?.leave().catch(() => {});
    }
  }, [call, navigation, startRecording]);

  const isConnecting =
    (callingState === CallingState.JOINING ||
      callingState === CallingState.JOINED) &&
    recordingState !== 'recording';

  const buttonLabel = useMemo(() => {
    if (isConnecting) return 'Connecting…';
    if (recordingState === 'recording') return 'Stop recording';
    return 'Record loopback';
  }, [recordingState, isConnecting]);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <LoopbackPanel
        loopbackVideoStream={loopbackVideoStream}
        loopbackAudioStream={loopbackAudioStream}
      />
      <InlineCallStats />
      <RecordingControls
        buttonLabel={buttonLabel}
        recordingState={recordingState}
        isConnecting={isConnecting}
        onStart={runTest}
        stopRecording={stopRecording}
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
          paddingHorizontal: appTheme.spacing.md,
          paddingTop: appTheme.spacing.md,
          paddingBottom: appTheme.spacing.md + theme.variants.insets.bottom,
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
