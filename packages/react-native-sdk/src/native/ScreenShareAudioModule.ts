import { NativeModules, Platform } from 'react-native';

const StreamVideoReactNative = NativeModules.StreamVideoReactNative;

/**
 * Prepares the screen share audio mixer by creating the mixer instance
 * and setting it as the audio graph delegate. This should be called early
 * (at call join time) so the audio graph is configured during engine setup,
 * before the engine starts rendering.
 *
 * iOS only — Android mixing setup happens inline in start/stop.
 */
export async function prepareScreenShareAudioMixing(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  return StreamVideoReactNative?.prepareScreenShareAudioMixing();
}

/**
 * Cleans up the screen share audio mixer, removing the delegate and
 * detaching nodes from the audio graph. Call this when the call ends.
 *
 * iOS only — Android cleanup happens inline in start/stop.
 */
export async function cleanupScreenShareAudioMixing(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  return StreamVideoReactNative?.cleanupScreenShareAudioMixing();
}

/**
 * Starts mixing screen share audio into the microphone audio track.
 * On iOS, this enables audio buffer processing on the prepared mixer.
 * On Android, this registers an audio processor that captures system media
 * audio via AudioPlaybackCaptureConfiguration and mixes it into the mic buffer.
 */
export async function startScreenShareAudioMixing(): Promise<void> {
  return StreamVideoReactNative?.startScreenShareAudioMixing();
}

/**
 * Stops mixing screen share audio into the microphone audio track
 * and restores the original audio pipeline.
 */
export async function stopScreenShareAudioMixing(): Promise<void> {
  return StreamVideoReactNative?.stopScreenShareAudioMixing();
}

/**
 * Starts in-app screen capture using RPScreenRecorder (iOS only).
 * Unlike broadcast screen sharing, in-app capture runs in the main app process
 * and can directly provide `.audioApp` sample buffers for mixing.
 *
 * @param includeAudio Whether to capture and mix app audio.
 */
export async function startInAppScreenCapture(
  includeAudio: boolean,
): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  return StreamVideoReactNative?.startInAppScreenCapture(includeAudio);
}

/**
 * Stops in-app screen capture (iOS only).
 */
export async function stopInAppScreenCapture(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  return StreamVideoReactNative?.stopInAppScreenCapture();
}
