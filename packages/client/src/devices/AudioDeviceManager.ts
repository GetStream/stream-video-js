import { DeviceManager } from './DeviceManager';
import { AudioDeviceManagerState } from './AudioDeviceManagerState';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { TrackPublishOptions } from '../rtc';

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
  async setAudioBitrateProfile(profile: AudioBitrateProfile, stereo: boolean) {
    if (!this.call.state.settings?.audio.hifi_audio_enabled) {
      throw new Error('High Fidelity audio is not enabled for this call');
    }
    await this.doSetAudioBitrateProfile(profile, stereo);
    this.state.setAudioBitrateProfile(profile, stereo);
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
      stereo: this.state.stereo,
      ...options,
    });
  }

  /**
   * Applies Device Manager's specific audio profile settings.
   */
  protected abstract doSetAudioBitrateProfile(
    profile: AudioBitrateProfile,
    stereo: boolean,
  ): Promise<void>;
}
