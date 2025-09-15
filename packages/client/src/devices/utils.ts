import { AudioBitrateProfile } from '../gen/video/sfu/models/models';

/**
 * Deactivates MediaStream (stops and removes tracks) to be later garbage collected
 *
 * @param stream MediaStream
 * @returns void
 */
export const disposeOfMediaStream = (stream: MediaStream) => {
  if (!stream.active) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
  // @ts-expect-error release() is present in react-native-webrtc and must be called to dispose the stream
  if (typeof stream.release === 'function') {
    // @ts-expect-error - release() is present in react-native-webrtc
    stream.release();
  }
};

/**
 * Prepares a new MediaTrackConstraints set based on the provided arguments.
 */
export const createAudioConstraints = (
  profile: AudioBitrateProfile,
  stereo: boolean,
): MediaTrackConstraints => {
  const enableProcessing = profile === AudioBitrateProfile.MUSIC_HIGH_QUALITY;
  return {
    echoCancellation: enableProcessing,
    noiseSuppression: enableProcessing,
    autoGainControl: enableProcessing,
    channelCount: { ideal: stereo ? 2 : 1 },
  };
};
