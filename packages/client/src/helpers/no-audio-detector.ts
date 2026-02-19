import { videoLoggerSystem } from '../logger';

export type NoAudioDetectorOptions = {
  /**
   * Defines how often the detector should check whether audio is present.
   * Defaults to 350ms.
   */
  detectionFrequencyInMs?: number;
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
   * Defaults to 512.
   * Only applies to browser implementation.
   */
  fftSize?: number;
  /**
   * A callback which is called when the audio capture status changes.
   * Called periodically while no audio is detected, and once when audio is detected.
   */
  onCaptureStatusChange: (capturesAudio: boolean) => void;
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
 * Analyzes time-domain waveform data to determine if audio is being captured.
 * Uses the waveform RMS around the 128 midpoint for robust silence detection.
 */
const hasAudio = (analyser: AnalyserNode): boolean => {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);

  let squareSum = 0;
  for (const sample of data) {
    const centered = sample - 128;
    // Ignore tiny quantization/jitter around midpoint (e.g. 127/128 samples).
    const signal = Math.abs(centered) <= 1 ? 0 : centered;
    squareSum += signal * signal;
  }

  const rms = Math.sqrt(squareSum / data.length);
  return rms > 0;
};

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
    // Any observed audio means the microphone is capturing.
    // Emit recovery/success and let the caller stop the detector.
    return emit(true, { kind: 'IDLE' });
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
    fftSize = 512,
    onCaptureStatusChange,
  } = options;

  let state: DetectorState = { kind: 'IDLE' };
  const { audioContext, analyser } = createAudioAnalyzer(audioStream, fftSize);
  const detectionIntervalId = setInterval(() => {
    const [track] = audioStream.getAudioTracks();
    if (track && !track.enabled) {
      state = { kind: 'IDLE' };
      return;
    }

    // Missing or ended track is treated as no-audio to surface abrupt capture loss.
    const audioDetected = track?.readyState === 'live' && hasAudio(analyser);
    const transition = transitionState(state, audioDetected, options);

    state = transition.nextState;
    if (!transition.shouldEmit) return;

    const { capturesAudio } = transition;
    onCaptureStatusChange(capturesAudio);

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
