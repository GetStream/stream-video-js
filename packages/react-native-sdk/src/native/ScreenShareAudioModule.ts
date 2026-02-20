import { NativeModules, Platform } from 'react-native';

const StreamVideoReactNative = NativeModules.StreamVideoReactNative;

/**
 * Starts mixing screen share audio into the microphone audio track.
 * On iOS, this rewires the AVAudioEngine graph to insert a mixer node.
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
