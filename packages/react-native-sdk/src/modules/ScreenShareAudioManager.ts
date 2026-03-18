import { NativeModules, Platform } from 'react-native';

const StreamVideoReactNative = NativeModules.StreamVideoReactNative;

export class ScreenShareAudioManager {
  /**
   * Starts mixing screen share audio into the microphone audio track.
   * On iOS, this enables audio buffer processing on the prepared mixer.
   * On Android, this registers an audio processor that captures system media
   * audio via AudioPlaybackCaptureConfiguration and mixes it into the mic buffer.
   */
  async startScreenShareAudioMixing(): Promise<void> {
    return StreamVideoReactNative?.startScreenShareAudioMixing();
  }

  /**
   * Stops mixing screen share audio into the microphone audio track
   * and restores the original audio pipeline.
   */
  async stopScreenShareAudioMixing(): Promise<void> {
    return StreamVideoReactNative?.stopScreenShareAudioMixing();
  }

  /**
   * Starts in-app screen capture using RPScreenRecorder (iOS only).
   * Unlike broadcast screen sharing, in-app capture runs in the main app process
   * and can directly provide `.audioApp` sample buffers for mixing.
   *
   * @param includeAudio Whether to capture and mix app audio.
   */
  async startInAppScreenCapture(includeAudio: boolean): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    return StreamVideoReactNative?.startInAppScreenCapture(includeAudio);
  }

  /**
   * Stops in-app screen capture (iOS only).
   */
  async stopInAppScreenCapture(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    return StreamVideoReactNative?.stopInAppScreenCapture();
  }
}

export const screenShareAudioMixingManager = new ScreenShareAudioManager();
