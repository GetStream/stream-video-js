import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules } from 'react-native';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import {
  Call,
  CallingState,
  videoLoggerSystem,
  type StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/** @internal */
const { StreamVideoReactNative } = NativeModules;

// Upper bound on how long `startRecording` will wait for the SFU to
// echo loopback tracks back via the Subscriber. Tuned generously since
// this includes connection setup; consumers that want shorter feedback
// should call `stopRecording` to cancel the wait early.
const STREAMS_WAIT_TIMEOUT_MS = 10 * 1000;
const RECORDING_DURATION = 10 * 1000;

type LoopbackStreams = {
  loopbackVideoStream?: MediaStream;
  loopbackAudioStream?: MediaStream;
};

export type LoopbackRecordingState = 'idle' | 'awaiting-streams' | 'recording';

export type ResolvedStreams = {
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
};

export interface StartLoopbackRecordingOptions {
  /**
   * Whether to include the loopback video track in the recording.
   * Defaults to `true`. Set to `false` for an audio-only recording.
   * Audio is always recorded — there is no video-only mode.
   */
  includeVideo?: boolean;
}

export interface UseLoopbackRecordingResult {
  /**
   * Start a recording. The hook waits internally for the SFU loopback
   * streams to arrive on `localParticipant`, then begins recording.
   *
   * The returned promise resolves with the produced `file://` URI **at
   * the recording's terminal moment** — whether that is the auto-stop
   * timer expiring, an explicit `stopRecording` call, or a cleanup-
   * driven stop on unmount/leave. Resolves with `null` if no file was
   * produced (writer torn down before any buffer arrived, or
   * `stopRecording` was called while still awaiting streams). Rejects
   * on a fatal error, if a recording is already running, or if the
   * stream-wait times out.
   */
  startRecording: (
    options?: StartLoopbackRecordingOptions,
  ) => Promise<string | null>;
  /**
   * Signal an early termination. While `awaiting-streams` this aborts
   * the wait and the pending `startRecording` resolves with `null`.
   * While `recording` this signals native finalisation and resolves
   * once it completes.
   */
  stopRecording: () => Promise<void>;
  /**
   * Recursively delete every file under the SDK's recordings directory.
   */
  clearRecordings: () => Promise<void>;
  /**
   * List every `file://` URI in the SDK's recordings directory, sorted
   * most-recent first. Returns an empty array if the directory doesn't
   * exist yet.
   */
  getRecordings: () => Promise<string[]>;
  /**
   * Lifecycle phase of the recording, owned by the hook:
   *  - `'idle'`: no recording in progress.
   *  - `'awaiting-streams'`: `startRecording` was called but the SFU
   *    has not yet echoed the loopback tracks back.
   *  - `'recording'`: native pipeline is actively writing.
   */
  recordingState: LoopbackRecordingState;
  /**
   * The SFU loopback video stream on the local participant, when
   * present. Identified by reference inequality against
   * `call.camera.state.mediaStream`.
   */
  loopbackVideoStream?: MediaStream;
  /**
   * The SFU loopback audio stream on the local participant, when
   * present. Identified by reference inequality against
   * `call.microphone.state.mediaStream`.
   */
  loopbackAudioStream?: MediaStream;
}

/**
 * Records the SFU loopback streams (audio + video) on the local participant
 * to a local MP4 file. Designed for the `selfSubEnabled` pre-call test mode:
 * the SFU echoes the caller's published tracks back through the Subscriber
 * peer connection. The hook identifies the loopback streams on the local
 * participant by reference inequality against
 * `call.camera.state.mediaStream` / `call.microphone.state.mediaStream` —
 * the canonical references to the local capture — and captures them.
 */
export function useLoopbackRecording(): UseLoopbackRecordingResult {
  const call = useCall();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const [recordingState, setRecordingState] =
    useState<LoopbackRecordingState>('idle');
  const recordingStateRef = useRef<LoopbackRecordingState>('idle');
  const isMountedRef = useRef(true);
  // Used to abort the awaiting-streams wait on stop / leave / unmount.
  const awaitAbortRef = useRef<AbortController | null>(null);

  const [loopbackStreams, setLoopbackStreams] = useState<LoopbackStreams>(
    () => {
      if (!call) return {};
      return getLoopbackStreamsFor(
        call.state.localParticipant,
        call.camera.state.mediaStream,
        call.microphone.state.mediaStream,
      );
    },
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

    await StreamVideoReactNative?.stopTrackRecording();
  }, []);

  const startRecording = useCallback(
    async ({
      includeVideo = true,
    }: StartLoopbackRecordingOptions = {}): Promise<string | null> => {
      if (!call) {
        return null;
      }

      if (recordingStateRef.current !== 'idle') {
        console.warn('useLoopbackRecording: a recording is already running');
        return null;
      }

      if (call.state.participantCount > 1) {
        console.warn(
          'useLoopbackRecording: cannot start recording with other participants present',
        );
        return null;
      }

      awaitAbortRef.current = new AbortController();
      updateState('awaiting-streams');

      let audioTrack: MediaStreamTrack | undefined;
      try {
        const streams = await waitForLoopbackStreams(call, {
          includeVideo,
          signal: awaitAbortRef.current.signal,
          timeoutMs: STREAMS_WAIT_TIMEOUT_MS,
        });

        if (streams === null) {
          videoLoggerSystem
            .getLogger('useLoopbackRecording')
            .warn('timed out waiting for loopback streams');
          return null;
        }

        audioTrack = streams.audioTrack;
        const videoTrackId = streams.videoTrack?.id;

        // The loopback audio track lands disabled (the SDK default-mutes
        // it to prevent echo). Enable it so the native recording
        // pipeline receives PCM; `finally` returns it to muted.
        if (audioTrack) {
          audioTrack.enabled = true;
        }
        updateState('recording');

        const uri: string | null =
          await StreamVideoReactNative.startTrackRecording({
            videoTrackId,
            maxDurationMs: Math.round(RECORDING_DURATION),
          });
        return uri;
      } finally {
        if (audioTrack) {
          audioTrack.enabled = false;
        }
        awaitAbortRef.current = null;
        updateState('idle');
      }
    },
    [call, updateState],
  );

  const clearRecordings = useCallback(async (): Promise<void> => {
    await StreamVideoReactNative.clearStreamRecordings();
  }, []);

  const getRecordings = useCallback(async (): Promise<string[]> => {
    const list: string[] | null | undefined =
      await StreamVideoReactNative.getStreamRecordings();
    return list ?? [];
  }, []);

  // Auto-stop on call leave / end. Aborts an awaiting-streams wait or
  // signals native finalisation depending on which phase we're in.
  // Without this, leaving the call mid-recording would leave native
  // encoders mid-write while the SFU subscriber tracks end under their
  // feet — undefined final file state.
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

  // Auto-stop if another participant joins. Loopback recording is a
  // single-user pre-call test.
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

  // Subscribe to the local participant, camera and microphone streams and update the loopback streams state.
  useEffect(() => {
    if (!call) return;

    const subscription = combineLatest([
      call.state.localParticipant$,
      call.camera.state.mediaStream$,
      call.microphone.state.mediaStream$,
    ])
      .pipe(
        map(([participant, cameraStream, microphoneStream]) =>
          getLoopbackStreamsFor(participant, cameraStream, microphoneStream),
        ),
        distinctUntilChanged(
          (a, b) =>
            a.loopbackVideoStream === b.loopbackVideoStream &&
            a.loopbackAudioStream === b.loopbackAudioStream,
        ),
      )
      .subscribe(setLoopbackStreams);

    return () => subscription.unsubscribe();
  }, [call]);

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

function getLoopbackStreamsFor(
  participant: StreamVideoParticipant | undefined,
  cameraStream: MediaStream | undefined,
  microphoneStream: MediaStream | undefined,
): LoopbackStreams {
  return {
    loopbackVideoStream:
      participant?.videoStream && participant.videoStream !== cameraStream
        ? participant.videoStream
        : undefined,
    loopbackAudioStream:
      participant?.audioStream && participant.audioStream !== microphoneStream
        ? participant.audioStream
        : undefined,
  };
}

/**
 * Subscribe to `localParticipant$` and resolve once the requested loopback
 * streams are present on the participant. Aborts cleanly on `signal`
 * (resolves `null`) and rejects on timeout.
 */
function waitForLoopbackStreams(
  call: Call,
  opts: { includeVideo: boolean; signal: AbortSignal; timeoutMs: number },
): Promise<ResolvedStreams | null> {
  return new Promise((resolve, reject) => {
    const initial = getLoopbackStreams(
      call.state.localParticipant,
      call.camera.state.mediaStream,
      call.microphone.state.mediaStream,
      opts.includeVideo,
    );
    if (initial) {
      resolve(initial);
      return;
    }

    const cleanup = () => {
      subscription.unsubscribe();
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      opts.signal.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      resolve(null);
    };

    opts.signal.addEventListener('abort', onAbort);

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'useLoopbackRecording: timed out waiting for loopback streams. ' +
            'Ensure the call was joined with `selfSubEnabled: true` and ' +
            'that the SFU is configured to echo self-sub tracks.',
        ),
      );
    }, opts.timeoutMs);

    const subscription = combineLatest([
      call.state.localParticipant$,
      call.camera.state.mediaStream$,
      call.microphone.state.mediaStream$,
    ]).subscribe(([participant, cameraStream, microphoneStream]) => {
      const ready = getLoopbackStreams(
        participant,
        cameraStream,
        microphoneStream,
        opts.includeVideo,
      );
      if (ready) {
        cleanup();
        resolve(ready);
      }
    });
  });
}

function getLoopbackStreams(
  participant: StreamVideoParticipant | undefined,
  cameraStream: MediaStream | undefined,
  microphoneStream: MediaStream | undefined,
  includeVideo: boolean,
): ResolvedStreams | undefined {
  if (!participant) return undefined;

  const { loopbackAudioStream, loopbackVideoStream } = getLoopbackStreamsFor(
    participant,
    cameraStream,
    microphoneStream,
  );

  const audioTrack = loopbackAudioStream?.getAudioTracks()[0];
  const videoTrack = includeVideo
    ? loopbackVideoStream?.getVideoTracks()[0]
    : undefined;

  if (!audioTrack || (includeVideo && !videoTrack)) {
    return undefined;
  }

  return { audioTrack, videoTrack };
}
