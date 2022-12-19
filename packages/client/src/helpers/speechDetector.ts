export type SpeechDetectorOptions = {
  /**
   * Defines how often the speech detector should check for speech.
   * Defaults to 500ms.
   */
  detectionFrequencyInMs?: number;

  /**
   * Defines the threshold for the audio level to be considered speech.
   * Defaults to 150. This value should be in the range of 0-255.
   */
  speechAudioLevelThreshold?: number;

  /**
   * See https://developer.mozilla.org/en-US/docs/web/api/analysernode/fftsize
   *
   * Defaults to 128.
   */
  fftSize?: number;
};

/**
 * Creates a new speech detector.
 *
 * @param audioStream the audio stream to observe. This stream will be destroyed when the speech detector is stopped.
 * @param onSpeechStateChange a callback which is called when the speech state changes.
 * @param options custom options for the speech detector.
 * @returns a clean-up function which once invoked stops the speech detector.
 */
export const createSpeechDetector = (
  audioStream: MediaStream,
  onSpeechStateChange: (isSpeechDetected: boolean) => void,
  options: SpeechDetectorOptions = {},
) => {
  const {
    detectionFrequencyInMs = 500,
    speechAudioLevelThreshold = 150,
    fftSize = 128,
  } = options;

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const microphone = audioContext.createMediaStreamSource(audioStream);
  microphone.connect(analyser);

  const intervalId = setInterval(() => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const isSpeechDetected = data.some(
      (value) => value >= speechAudioLevelThreshold,
    );

    onSpeechStateChange(isSpeechDetected);
  }, detectionFrequencyInMs);

  return async function stop() {
    clearInterval(intervalId);

    // clean-up the AudioContext elements
    microphone.disconnect();
    analyser.disconnect();
    await audioContext.close();

    // stop the stream
    audioStream.getTracks().forEach((track) => {
      track.stop();
      audioStream.removeTrack(track);
    });
  };
};
