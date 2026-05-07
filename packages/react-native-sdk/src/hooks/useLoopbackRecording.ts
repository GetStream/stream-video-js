import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules } from 'react-native';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/** @internal */
const { StreamVideoReactNative } = NativeModules;

const RECORDING_DURATION = 10 * 1000;

export interface StartLoopbackRecordingOptions {
  /**
   * Whether to include the loopback video track in the recording.
   * Defaults to `true`. Set to `false` for an audio-only recording.
   * Audio is always recorded — there is no video-only mode.
   */
  includeVideo?: boolean;
  /**
   * When `true` (default), silences the speaker while recording so the
   * SFU loopback echo can't be re-captured by the mic and form a
   * feedback loop. The recording itself captures full audio — bytes
   * are taken from the pipeline before the mute takes effect.
   *
   * Defaults to `true` because the v1 use case is the self-sub pre-call
   * test, where post-mix audio is exactly the loopback echo and
   * silencing it is the desired behaviour.
   *
   * Caveat: the mute is applied at a post-mix point on both platforms,
   * so any other remote participants on the call are also silenced for
   * the duration of the recording. Set to `false` if you need to hear
   * remote audio while recording.
   *
   * Implementation differs per platform but the behaviour is the same:
   *  - iOS zeros the audio buffer in the APM render-pre delegate after
   *    copying bytes for recording.
   *  - Android sets the system `AudioTrack`'s volume to 0; the JADM
   *    audio thread keeps running so our playback-samples callback
   *    still receives real PCM for the recording.
   */
  muteLoopbackPlayback?: boolean;
}

export interface UseLoopbackRecordingResult {
  /**
   * Start a recording. The returned promise resolves with the produced
   * `file://` URI **at the recording's terminal moment** — whether that is
   * the auto-stop timer expiring, an explicit `stopRecording` call, or a
   * cleanup-driven stop on unmount/leave. Resolves with `null` if the
   * writer was torn down before any buffer arrived (no file produced).
   * Rejects on a fatal error or if a recording is already running.
   */
  startRecording: (
    options?: StartLoopbackRecordingOptions,
  ) => Promise<string | null>;
  /**
   * Signal an early termination. Resolves once native finalisation has
   * completed — useful as a sync point before reading the recordings
   * directory. The URI is **not** delivered here; it is returned by the
   * still-pending promise from `startRecording`.
   */
  stopRecording: () => Promise<void>;
  /**
   * Recursively delete every file under the SDK's recordings directory.
   * Use this in app teardown or when the consumer is done with previously
   * produced files. The directory is shared across any future recording
   * use cases — consumers should be aware that this clears all of them.
   */
  clearRecordings: () => Promise<void>;
  /**
   * List every `file://` URI in the SDK's recordings directory, sorted
   * most-recent first. Returns an empty array if the directory doesn't
   * exist yet (no recording has ever completed). Call this *after* the
   * `startRecording` promise resolves (or `stopRecording` resolves) to
   * avoid racing the disk flush.
   */
  getRecordings: () => Promise<string[]>;
  /** `true` while a recording is in progress. Drives UI button states. */
  isRecording: boolean;
}

/**
 * Records the SFU loopback streams (audio + video) on the local participant
 * to a local MP4 file. Designed for the `selfSubEnabled` pre-call test mode:
 * the SFU echoes the caller's published tracks back through the Subscriber
 * peer connection, the SDK exposes them as
 * `localParticipant.loopbackVideoStream` / `loopbackAudioStream`, and this
 * hook captures them.
 *
 * The hook is the only public API for loopback recording. Native bridge
 * methods are intentionally not re-exported — see the implementation plan's
 * threat model section for the rationale.
 */
export function useLoopbackRecording(): UseLoopbackRecordingResult {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Fire-and-forget early termination. Used by the auto-stop effects on
  // unmount and call-leave. The pending `startRecording` promise will
  // resolve when native finalisation completes; if the consumer captured
  // it (e.g. via `.then(setUri)` against a ref outside the component
  // tree), the URI lands there.
  const safeStop = useCallback(() => {
    if (!isRecordingRef.current) return;
    StreamVideoReactNative?.stopTrackRecording?.().catch(() => {});
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current) return;
    await StreamVideoReactNative.stopTrackRecording();
  }, []);

  const startRecording = useCallback(
    async ({
      includeVideo = true,
      muteLoopbackPlayback = true,
    }: StartLoopbackRecordingOptions = {}): Promise<string | null> => {
      if (!call) {
        throw new Error('useLoopbackRecording: no active call in context');
      }

      if (isRecordingRef.current) {
        throw new Error('useLoopbackRecording: a recording is already running');
      }
      const lp = call.state.localParticipant;
      const videoTrackId = includeVideo
        ? lp?.loopbackVideoStream?.getVideoTracks()[0]?.id
        : undefined;
      const audioTrackId = lp?.loopbackAudioStream?.getAudioTracks()[0]?.id;

      if (!videoTrackId && !audioTrackId) {
        throw new Error(
          'useLoopbackRecording: no loopback streams available on the ' +
            'local participant. Ensure the call was joined with ' +
            '`selfSubEnabled: true` and that the SFU has started echoing ' +
            'self-sub tracks.',
        );
      }

      // Set the ref *before* the await so unmount/call-leave during the
      // in-flight bridge call can see we intend to be recording and trigger
      // cleanup. The ref is cleared in the finally block so every
      // termination path (success, error, sync throw) flips it back.
      isRecordingRef.current = true;
      if (isMountedRef.current) setIsRecording(true);
      try {
        const uri: string | null =
          await StreamVideoReactNative.startTrackRecording({
            videoTrackId,
            audioTrackId,
            maxDurationMs: Math.round(RECORDING_DURATION),
            muteLoopbackPlayback,
          });
        return uri;
      } finally {
        isRecordingRef.current = false;
        if (isMountedRef.current) setIsRecording(false);
      }
    },
    [call],
  );

  const clearRecordings = useCallback(async (): Promise<void> => {
    await StreamVideoReactNative.clearStreamRecordings();
  }, []);

  const getRecordings = useCallback(async (): Promise<string[]> => {
    const list: string[] | null | undefined =
      await StreamVideoReactNative.getStreamRecordings();
    return list ?? [];
  }, []);

  // Auto-stop on call leave / end. Without this, leaving the call mid-
  // recording would leave native encoders mid-write while the SFU
  // subscriber tracks end under their feet — undefined final file state.
  useEffect(() => {
    if (
      callingState === CallingState.LEFT ||
      callingState === CallingState.IDLE
    ) {
      safeStop();
    }
  }, [callingState, safeStop]);

  // Auto-stop on unmount. Bounds the recording's lifetime to the component
  // that started it. The pending `startRecording` promise still resolves
  // with the produced URI; consumers that need it after unmount must
  // capture the promise via a stable ref/store outside the React tree.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      safeStop();
    };
  }, [safeStop]);

  return {
    startRecording,
    stopRecording,
    clearRecordings,
    getRecordings,
    isRecording,
  };
}
