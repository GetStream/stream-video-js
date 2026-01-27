import { videoLoggerSystem } from '../logger';

export type NoAudioDetectorOptions = {
  /**
   * Defines how often the detector should check whether audio is present.
   * Defaults to 500ms.
   */
  detectionFrequencyInMs?: number;

  /**
   * Defines the audio level threshold. Values below this are considered no audio.
   * Defaults to 5. This value should be in the range of 0-255.
   * Only applies to browser implementation.
   */
  audioLevelThreshold?: number;

  /**
   * Duration of continuous no-audio (in ms) before emitting the first event.
   * Defaults to 5000ms (5 seconds).
   */
  noAudioThresholdMs?: number;

  /**
   * How often to emit events while no-audio continues (in ms).
   * After the initial no-audio threshold is met, events will be emitted at this interval.
   * Defaults to the same value as noAudioThresholdMs.
   */
  emitIntervalMs?: number;

  /**
   * See https://developer.mozilla.org/en-US/docs/web/api/analysernode/fftsize
   *
   * Defaults to 256.
   * Only applies to browser implementation.
   */
  fftSize?: number;

  /**
   * A callback which is called when the audio capture status changes.
   * Called periodically while no audio is detected, and once when audio is detected.
   */
  onCaptureStatusChange: (event: CaptureStatusEvent) => void;
};

export type CaptureStatusEvent = {
  /**
   * Whether the microphone is capturing audio.
   */
  capturesAudio: boolean;
  /**
   * The audio device associated with the audio stream.
   */
  deviceId?: string;
  /**
   * The label of the audio device associated with the audio stream.
   */
  label?: string;
};

type TrackMetadata = {
  deviceId?: string;
  label?: string;
};

type DetectionState = {
  noAudioStartTime: number | null;
  lastEmitTime: number | null;
};

/**
 * Checks if the audio track is active and ready for analysis.
 */
const isAudioTrackActive = (audioTrack?: MediaStreamTrack): boolean =>
  !!(audioTrack?.enabled && audioTrack.readyState !== 'ended');

/**
 * Analyzes frequency data to determine if audio is being captured.
 */
const hasAudio = (analyser: AnalyserNode, threshold: number): boolean => {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data.some((value) => value >= threshold);
};

/**
 * Extracts device metadata from an audio track.
 */
const getTrackMetadata = (audioTrack?: MediaStreamTrack): TrackMetadata => ({
  deviceId: audioTrack?.getSettings().deviceId,
  label: audioTrack?.label,
});

/**
 * Determines if a no-audio event should be emitted based on elapsed time and timing rules.
 */
const shouldEmitNoAudioEvent = (
  state: DetectionState,
  options: NoAudioDetectorOptions,
): boolean => {
  if (state.noAudioStartTime === null) return false;

  const elapsed = Date.now() - state.noAudioStartTime;
  const timeSinceLastEmit = state.lastEmitTime
    ? Date.now() - state.lastEmitTime
    : Infinity;

  const { noAudioThresholdMs = 5000, emitIntervalMs = 5000 } = options;
  return elapsed >= noAudioThresholdMs && timeSinceLastEmit >= emitIntervalMs;
};

/**
 * Handles the case when no audio is detected (browser version).
 */
const handleNoAudioDetected = (
  state: DetectionState,
  options: NoAudioDetectorOptions,
): CaptureStatusEvent | undefined => {
  // Initialize timing if this is the first detection
  if (state.noAudioStartTime === null) {
    state.noAudioStartTime = Date.now();
    state.lastEmitTime = null;
  }

  if (!shouldEmitNoAudioEvent(state, options)) return;
  state.lastEmitTime = Date.now();
  return { capturesAudio: false };
};

/**
 * Handles the case when audio is detected after a period of no-audio (browser version).
 */
const handleAudioDetected = (
  state: DetectionState,
): CaptureStatusEvent | undefined => {
  const wasInNoAudioState = state.noAudioStartTime !== null;
  if (wasInNoAudioState) {
    return { capturesAudio: true };
  }

  // Reset timing state
  state.noAudioStartTime = null;
  state.lastEmitTime = null;

  return undefined;
};

/**
 * Creates and configures an audio analyzer for the given stream.
 */
const createAudioAnalyzer = (audioStream: MediaStream, fftSize: number) => {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const microphone = audioContext.createMediaStreamSource(audioStream);
  microphone.connect(analyser);

  return { audioContext, analyser };
};

/**
 * Creates a new no-audio detector that monitors continuous absence of audio on an audio stream.
 * Unlike the sound detector which emits on every state change, this detector emits
 * events periodically while no audio is detected after a threshold duration.
 *
 * Useful for detecting broken microphone setups or muted/disconnected audio devices.
 *
 * Works on both browser (Web Audio API) and React Native (RNSpeechDetector) platforms.
 *
 * @param audioStream the audio stream to observe.
 * @param options custom options for the no-audio detector.
 * @returns a cleanup function which once invoked stops the no-audio detector.
 */
export const createNoAudioDetector = (
  audioStream: MediaStream,
  options: NoAudioDetectorOptions,
) => {
  const {
    detectionFrequencyInMs = 350,
    audioLevelThreshold = 3,
    fftSize = 256,
    onCaptureStatusChange,
  } = options;

  const { audioContext, analyser } = createAudioAnalyzer(audioStream, fftSize);
  const state: DetectionState = {
    noAudioStartTime: null,
    lastEmitTime: null,
  };

  // Main detection loop
  const detectionIntervalId = setInterval(() => {
    const [audioTrack] = audioStream.getAudioTracks();
    if (!isAudioTrackActive(audioTrack)) {
      state.noAudioStartTime = null;
      state.lastEmitTime = null;
      return;
    }

    const event = hasAudio(analyser, audioLevelThreshold)
      ? handleAudioDetected(state)
      : handleNoAudioDetected(state, options);

    if (event) {
      if (event.capturesAudio) {
        clearInterval(detectionIntervalId);
        if (audioContext.state !== 'closed') {
          audioContext.close().catch((err) => {
            const logger = videoLoggerSystem.getLogger('no-audio-detector');
            logger.error('Failed to close audio context', err);
          });
        }
      }

      onCaptureStatusChange({ ...event, ...getTrackMetadata(audioTrack) });
    }
  }, detectionFrequencyInMs);

  return async function stop() {
    clearInterval(detectionIntervalId);
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  };
};
