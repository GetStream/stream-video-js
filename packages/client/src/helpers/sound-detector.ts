export type SoundDetectorOptions = {
  /**
   * Defines how often the detector should check whether a sound is present.
   * Defaults to 500ms.
   */
  detectionFrequencyInMs?: number;

  /**
   * Defines the audio level threshold before a "change" is emitted.
   * Defaults to 150. This value should be in the range of 0-255.
   */
  audioLevelThreshold?: number;

  /**
   * See https://developer.mozilla.org/en-US/docs/web/api/analysernode/fftsize
   *
   * Defaults to 128.
   */
  fftSize?: number;

  /**
   * Defines whether the provided audio stream should be stopped (destroyed)
   * when the sound detector is stopped.
   *
   * Defaults to `true`.
   */
  destroyStreamOnStop?: boolean;
};

const DETECTION_FREQUENCY_IN_MS = 500;
const AUDIO_LEVEL_THRESHOLD = 150;
const FFT_SIZE = 128;

/**
 * Creates a new sound detector.
 *
 * @param audioStream the audio stream to observe. Depending on the provided configuration, this stream might be destroyed when the sound detector is stopped.
 * @param onSoundDetectedStateChanged a callback which is called when the sound state changes.
 * @param options custom options for the sound detector.
 * @returns a clean-up function which once invoked stops the sound detector.
 */
export const createSoundDetector = (
  audioStream: MediaStream,
  onSoundDetectedStateChanged: (isSoundDetected: boolean) => void,
  options: SoundDetectorOptions = {},
) => {
  const {
    detectionFrequencyInMs = DETECTION_FREQUENCY_IN_MS,
    audioLevelThreshold = AUDIO_LEVEL_THRESHOLD,
    fftSize = FFT_SIZE,
    destroyStreamOnStop = true,
  } = options;

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const microphone = audioContext.createMediaStreamSource(audioStream);
  microphone.connect(analyser);

  const intervalId = setInterval(() => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const isSoundDetected = data.some((value) => value >= audioLevelThreshold);
    onSoundDetectedStateChanged(isSoundDetected);
  }, detectionFrequencyInMs);

  return async function stop() {
    clearInterval(intervalId);

    // clean-up the AudioContext elements
    microphone.disconnect();
    analyser.disconnect();
    await audioContext.close();

    // stop the stream
    if (destroyStreamOnStop) {
      audioStream.getTracks().forEach((track) => {
        track.stop();
        audioStream.removeTrack(track);
      });
    }
  };
};
