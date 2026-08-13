import { DeviceManager } from './DeviceManager';
import { AudioDeviceManagerState } from './AudioDeviceManagerState';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { TrackPublishOptions } from '../rtc';
import { isReactNative } from '../helpers/platforms';

/**
 * Base class for High Fidelity enabled Device Managers.
 */
export abstract class AudioDeviceManager<
  S extends AudioDeviceManagerState<C>,
  C = MediaTrackConstraints,
> extends DeviceManager<S, C> {
  /**
   * Sets the audio bitrate profile and stereo mode.
   */
  async setAudioBitrateProfile(profile: AudioBitrateProfile) {
    if (!this.call.state.settings?.audio.hifi_audio_enabled) {
      throw new Error('High Fidelity audio is not enabled for this call');
    }
    if (isReactNative() && this.call.hasMediaEngine) {
      throw new Error(
        'setAudioBitrateProfile must be called before joining the call.',
      );
    }
    this.doSetAudioBitrateProfile(profile);
    this.state.setAudioBitrateProfile(profile);
    if (this.enabled) {
      await this.applySettingsToStream();
    }
  }

  /**
   * Overrides the default `publishStream` method to inject the audio bitrate profile.
   */
  protected override publishStream(
    stream: MediaStream,
    options?: TrackPublishOptions,
  ): Promise<void> {
    return super.publishStream(stream, {
      audioBitrateProfile: this.state.audioBitrateProfile,
      ...options,
    });
  }

  /**
   * Applies Device Manager's specific audio profile settings.
   */
  protected abstract doSetAudioBitrateProfile(
    profile: AudioBitrateProfile,
  ): void;
}

/**
 * Prepares a new MediaTrackConstraints set based on the provided arguments.
 */
export const createAudioConstraints = (
  profile: AudioBitrateProfile,
): MediaTrackConstraints => {
  const stereo = profile === AudioBitrateProfile.MUSIC_HIGH_QUALITY;
  return {
    echoCancellation: !stereo,
    noiseSuppression: !stereo,
    autoGainControl: !stereo,
    channelCount: { ideal: stereo ? 2 : 1 },
  };
};
