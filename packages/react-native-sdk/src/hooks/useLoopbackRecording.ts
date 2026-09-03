import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules } from 'react-native';
import {
  CallingState,
  DEFAULT_LOOPBACK_RECORDING_DURATION_MS,
  LOOPBACK_STREAMS_WAIT_TIMEOUT_MS,
  clampLoopbackRecordingDuration,
  getLoopbackStreams,
  videoLoggerSystem,
  waitForLoopbackStreams,
  withLoopbackAudioEnabled,
  type LoopbackStreams,
  type LoopbackTracks,
} from '@stream-io/video-client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/** @internal */
const { StreamVideoReactNative } = NativeModules;

export type LoopbackRecordingState = 'idle' | 'awaiting-streams' | 'recording';

export type ResolvedStreams = LoopbackTracks;

export interface StartLoopbackRecordingOptions {
  /** Whether to include loopback video. Audio is always recorded. */
  includeVideo?: boolean;
  /** Maximum recording duration in milliseconds. */
  maxDurationMs?: number;
}

export interface UseLoopbackRecordingResult {
  /** Starts recording and resolves with a `file://` URI. */
  startRecording: (
    options?: StartLoopbackRecordingOptions,
  ) => Promise<string | null>;
  /** Stops the current recording or stream wait. */
  stopRecording: () => Promise<void>;
  /** Deletes all SDK recording files. */
  clearRecordings: () => Promise<void>;
  /** Lists SDK recording file URIs. */
  getRecordings: () => Promise<string[]>;
  /** Lifecycle phase of the recording. */
  recordingState: LoopbackRecordingState;
  /** SFU-echoed video stream on the local participant. */
  loopbackVideoStream?: MediaStream;
  /** SFU-echoed audio stream on the local participant. */
  loopbackAudioStream?: MediaStream;
}

/** Records SFU loopback streams to a local MP4 file. */
export function useLoopbackRecording(): UseLoopbackRecordingResult {
  const call = useCall();
  const { useCallCallingState, useParticipantCount, useLocalParticipant } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const localParticipant = useLocalParticipant();

  const [recordingState, setRecordingState] =
    useState<LoopbackRecordingState>('idle');
  const recordingStateRef = useRef<LoopbackRecordingState>('idle');
  const isMountedRef = useRef(true);
  const awaitAbortRef = useRef<AbortController | null>(null);

  const loopbackStreams = useMemo<LoopbackStreams>(
    () => getLoopbackStreams(call, localParticipant),
    [call, localParticipant],
  );

  const updateState = useCallback((next: LoopbackRecordingState) => {
    recordingStateRef.current = next;
    if (isMountedRef.current) {
      setRecordingState(next);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    const current = recordingStateRef.current;
    if (current === 'idle') {
      return;
    }

    if (current === 'awaiting-streams') {
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .debug('aborting awaiting-streams wait');
      awaitAbortRef.current?.abort();
      return;
    }

    try {
      await StreamVideoReactNative.stopTrackRecording();
    } catch (error) {
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .error('failed to stop recording', error);
      throw new Error('failed to stop recording');
    }
  }, []);

  const startRecording = useCallback(
    async ({
      includeVideo = true,
      maxDurationMs = DEFAULT_LOOPBACK_RECORDING_DURATION_MS,
    }: StartLoopbackRecordingOptions = {}): Promise<string | null> => {
      if (!call) {
        return null;
      }

      if (recordingStateRef.current !== 'idle') {
        videoLoggerSystem
          .getLogger('useLoopbackRecording')
          .warn('a recording is already running');
        return null;
      }

      if (call.state.participantCount > 1) {
        videoLoggerSystem
          .getLogger('useLoopbackRecording')
          .warn('cannot start recording with other participants present');
        return null;
      }

      awaitAbortRef.current = new AbortController();
      updateState('awaiting-streams');

      try {
        const streams = await waitForLoopbackStreams(call, {
          includeVideo,
          signal: awaitAbortRef.current.signal,
          timeoutMs: LOOPBACK_STREAMS_WAIT_TIMEOUT_MS,
        });

        if (streams === null) {
          videoLoggerSystem
            .getLogger('useLoopbackRecording')
            .warn('timed out waiting for loopback streams');
          return null;
        }

        updateState('recording');

        const publishMaxDim = call.getMaxVideoPublishDimension();

        try {
          return await withLoopbackAudioEnabled(
            streams,
            (): Promise<string | null> =>
              StreamVideoReactNative.startTrackRecording({
                videoTrackId: streams.videoTrack?.id,
                maxDurationMs: clampLoopbackRecordingDuration(maxDurationMs),
                targetWidth: publishMaxDim?.width,
                targetHeight: publishMaxDim?.height,
              }),
          );
        } catch (error) {
          videoLoggerSystem
            .getLogger('useLoopbackRecording')
            .error('failed to start recording', error);
          throw new Error('failed to start recording');
        }
      } finally {
        awaitAbortRef.current = null;
        updateState('idle');
      }
    },
    [call, updateState],
  );

  const clearRecordings = useCallback(async (): Promise<void> => {
    try {
      await StreamVideoReactNative.clearStreamRecordings();
    } catch (error) {
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .error('failed to clear recordings', error);
      throw new Error('failed to clear recordings');
    }
  }, []);

  const getRecordings = useCallback(async (): Promise<string[]> => {
    try {
      const list: string[] | null | undefined =
        await StreamVideoReactNative.getStreamRecordings();
      return list ?? [];
    } catch (error) {
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .error('failed to get recordings', error);
      throw new Error('failed to get recordings');
    }
  }, []);

  useEffect(() => {
    if (
      callingState === CallingState.LEFT ||
      callingState === CallingState.IDLE
    ) {
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .debug('auto-stopping recording on call leave / end');
      stopRecording().catch(() => {});
    }
  }, [callingState, stopRecording]);

  useEffect(() => {
    if (recordingState !== 'idle' && participantCount > 1) {
      stopRecording().catch(() => {});
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .debug('auto-stopping recording on participant count change');
    }
  }, [participantCount, recordingState, stopRecording]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .debug('auto-stopping recording on unmount');
      stopRecording().catch(() => {});
    };
  }, [stopRecording]);

  return {
    startRecording,
    stopRecording,
    clearRecordings,
    getRecordings,
    recordingState,
    loopbackVideoStream: loopbackStreams.loopbackVideoStream,
    loopbackAudioStream: loopbackStreams.loopbackAudioStream,
  };
}
