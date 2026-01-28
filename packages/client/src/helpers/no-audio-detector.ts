import { videoLoggerSystem } from '../logger';

export type NoAudioDetectorOptions = {
  /**
   * Defines how often the detector should check whether audio is present.
   * Defaults to 350ms.
   */
  detectionFrequencyInMs?: number;

  /**
   * Defines the audio level threshold. Values below this are considered no audio.
   * Defaults to 3. This value should be in the range of 0-255.
   * Only applies to browser implementation.
   */
  audioLevelThreshold?: number;

  /**
   * Duration of continuous no-audio (in ms) before emitting the first event.
   */
  noAudioThresholdMs: number;

  /**
   * How often to emit events while no-audio continues (in ms).
   * After the initial no-audio threshold is met, events will be emitted at this interval.
   * Defaults to the same value as noAudioThresholdMs.
   */
  emitIntervalMs: number;

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

/**
 * Discriminated union representing the detector's state machine.
 */
type DetectorState =
  | { kind: 'IDLE' } // Initial state - need to do first check
  | { kind: 'DETECTING'; noAudioStartTime: number } // No audio detected, waiting for threshold
  | { kind: 'EMITTING'; noAudioStartTime: number; lastEmitTime: number }; // Emitting periodic no-audio events

/**
 * State transition result - discriminated union ensures capturesAudio is present when emitting.
 */
type StateTransition =
  | { shouldEmit: false; nextState: DetectorState }
  | { shouldEmit: true; nextState: DetectorState; capturesAudio: boolean };

/**
 * Analyzes frequency data to determine if audio is being captured.
 */
const hasAudio = (analyser: AnalyserNode, threshold: number): boolean => {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data.some((value) => value >= threshold);
};

/**
 * Creates a complete CaptureStatusEvent with audio status and device metadata.
 */
const createCaptureStatusEvent = (
  capturesAudio: boolean,
  audioTrack?: MediaStreamTrack,
): CaptureStatusEvent => ({
  capturesAudio,
  deviceId: audioTrack?.getSettings().deviceId,
  label: audioTrack?.label,
});

/** Helper for "no event" transitions */
const noEmit = (nextState: DetectorState): StateTransition => ({
  shouldEmit: false,
  nextState,
});

/** Helper for event-emitting transitions */
const emit = (
  capturesAudio: boolean,
  nextState: DetectorState,
): StateTransition => ({ shouldEmit: true, nextState, capturesAudio });

/**
 * State transition function - computes next state and whether to emit an event.
 */
const transitionState = (
  state: DetectorState,
  audioDetected: boolean,
  options: NoAudioDetectorOptions,
): StateTransition => {
  if (audioDetected) {
    return state.kind === 'IDLE' || state.kind === 'EMITTING'
      ? emit(true, state)
      : noEmit(state);
  }

  const { noAudioThresholdMs, emitIntervalMs } = options;
  const now = Date.now();

  switch (state.kind) {
    case 'IDLE':
      return noEmit({ kind: 'DETECTING', noAudioStartTime: now });

    case 'DETECTING': {
      const { noAudioStartTime } = state;
      const elapsed = now - noAudioStartTime;
      return elapsed >= noAudioThresholdMs
        ? emit(false, { kind: 'EMITTING', noAudioStartTime, lastEmitTime: now })
        : noEmit(state);
    }

    case 'EMITTING': {
      const timeSinceLastEmit = now - state.lastEmitTime;
      return timeSinceLastEmit >= emitIntervalMs
        ? emit(false, { ...state, lastEmitTime: now })
        : noEmit(state);
    }
  }
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

  let state: DetectorState = { kind: 'IDLE' };
  const detectionIntervalId = setInterval(() => {
    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack?.enabled || audioTrack.readyState === 'ended') {
      state = { kind: 'IDLE' };
      return;
    }

    const audioDetected = hasAudio(analyser, audioLevelThreshold);
    const transition = transitionState(state, audioDetected, options);

    state = transition.nextState;
    if (!transition.shouldEmit) return;

    const { capturesAudio } = transition;
    const event = createCaptureStatusEvent(capturesAudio, audioTrack);
    onCaptureStatusChange(event);

    if (capturesAudio) {
      stop().catch((err) => {
        const logger = videoLoggerSystem.getLogger('NoAudioDetector');
        logger.error('Error stopping no-audio detector', err);
      });
    }
  }, detectionFrequencyInMs);

  async function stop() {
    clearInterval(detectionIntervalId);
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }

  return stop;
};
