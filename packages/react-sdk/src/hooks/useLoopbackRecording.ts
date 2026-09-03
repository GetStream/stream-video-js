import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CallingState,
  DEFAULT_LOOPBACK_RECORDING_DURATION_MS,
  LOOPBACK_STREAMS_WAIT_TIMEOUT_MS,
  MediaStreamRecorder,
  clampLoopbackRecordingDuration,
  getLoopbackStreams,
  type MediaRecordingResult,
  videoLoggerSystem,
  waitForLoopbackStreams,
  enableLoopbackAudio,
  type LoopbackStreams,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/** Lifecycle phase of a loopback recording. */
export type LoopbackRecordingState = 'idle' | 'awaiting-streams' | 'recording';

const attachHiddenMediaSink = (stream: MediaStream): (() => void) => {
  const logger = videoLoggerSystem.getLogger('useLoopbackRecording');
  const element = document.createElement('video');
  element.muted = true;
  element.autoplay = true;
  element.playsInline = true;
  element.srcObject = stream;

  element.play().catch((error) => {
    logger.warn('sink element failed to play; recording may be empty', error);
  });

  return () => {
    element.pause();
    element.srcObject = null;
  };
};

export type StartLoopbackRecordingOptions = {
  /** Whether to include loopback video. Audio is always recorded. */
  includeVideo?: boolean;
  /** Maximum recording duration in milliseconds. */
  maxDurationMs?: number;
};

export type UseLoopbackRecordingResult = {
  /** Starts recording and resolves with the recorded blob. */
  startRecording: (
    options?: StartLoopbackRecordingOptions,
  ) => Promise<MediaRecordingResult | null>;
  /** Stops the current recording or stream wait. */
  stopRecording: () => Promise<void>;
  /** Lifecycle phase of the recording. */
  recordingState: LoopbackRecordingState;
  /** SFU-echoed video stream on the local participant. */
  loopbackVideoStream?: MediaStream;
  /** SFU-echoed audio stream on the local participant. */
  loopbackAudioStream?: MediaStream;
};

/** Records SFU loopback streams for pre-call testing. */
export const useLoopbackRecording = (): UseLoopbackRecordingResult => {
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
  const stopRef = useRef<(() => void) | null>(null);
  const runRef = useRef<Promise<unknown> | null>(null);

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
    if (current === 'idle') return;

    if (current === 'awaiting-streams') {
      videoLoggerSystem
        .getLogger('useLoopbackRecording')
        .debug('aborting the awaiting-streams wait');
      awaitAbortRef.current?.abort();
      return;
    }

    stopRef.current?.();
    await runRef.current;
  }, []);

  const startRecording = useCallback(
    async ({
      includeVideo = true,
      maxDurationMs = DEFAULT_LOOPBACK_RECORDING_DURATION_MS,
    }: StartLoopbackRecordingOptions = {}): Promise<MediaRecordingResult | null> => {
      const logger = videoLoggerSystem.getLogger('useLoopbackRecording');
      if (!call) return null;

      if (recordingStateRef.current !== 'idle') {
        logger.warn('a recording is already running');
        return null;
      }

      if (call.state.participantCount > 1) {
        logger.warn('cannot start recording with other participants present');
        return null;
      }

      const run = async (): Promise<MediaRecordingResult | null> => {
        awaitAbortRef.current = new AbortController();
        updateState('awaiting-streams');

        try {
          const tracks = await waitForLoopbackStreams(call, {
            includeVideo,
            signal: awaitAbortRef.current.signal,
            timeoutMs: LOOPBACK_STREAMS_WAIT_TIMEOUT_MS,
          });

          if (tracks === null) {
            logger.debug('loopback stream wait was aborted');
            return null;
          }

          updateState('recording');

          const restoreAudio = enableLoopbackAudio(tracks);
          const stream = new MediaStream(
            [tracks.audioTrack, tracks.videoTrack].filter(
              (track): track is MediaStreamTrack => !!track,
            ),
          );
          const detachSink = attachHiddenMediaSink(stream);
          const recorder = new MediaStreamRecorder(stream, {
            maxDurationMs: clampLoopbackRecordingDuration(maxDurationMs),
          });
          stopRef.current = recorder.stop;
          try {
            return await recorder.start();
          } finally {
            detachSink();
            restoreAudio();
          }
        } catch (err) {
          logger.error('loopback recording failed', err);
          throw err;
        } finally {
          awaitAbortRef.current = null;
          stopRef.current = null;
          updateState('idle');
        }
      };

      const promise = run();
      runRef.current = promise.catch(() => undefined);
      return promise;
    },
    [call, updateState],
  );

  useEffect(() => {
    if (
      callingState === CallingState.LEFT ||
      callingState === CallingState.IDLE
    ) {
      stopRecording().catch(() => {});
    }
  }, [callingState, stopRecording]);

  useEffect(() => {
    if (recordingState !== 'idle' && participantCount > 1) {
      stopRecording().catch(() => {});
    }
  }, [participantCount, recordingState, stopRecording]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      awaitAbortRef.current?.abort('the component unmounted');
      stopRef.current?.();
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    recordingState,
    loopbackVideoStream: loopbackStreams.loopbackVideoStream,
    loopbackAudioStream: loopbackStreams.loopbackAudioStream,
  };
};
