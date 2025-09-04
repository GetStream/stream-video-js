import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { AudioDeviceManagerState } from './AudioDeviceManagerState';
import { withStereoAudio } from './withStereoAudio';
import { AudioBitrateType } from '../gen/video/sfu/models/models';

/**
 * Base class for High Fidelity enabled Device Managers.
 */
export abstract class AudioDeviceManager<
  S extends AudioDeviceManagerState<C>,
  C = MediaTrackConstraints,
> extends InputMediaDeviceManager<S, C> {
  /**
   * Sets the audio bitrate type.
   * @param type the bitrate type to set.
   */
  async setAudioBitrateType(type: AudioBitrateType) {
    await this.doSetAudioBitrateType(type);
    this.state.setAudioBitrateType(type);
  }

  /**
   * Based on the current audio bitrate type, returns a stream with HiFi audio enabled.
   * @param constraints the constraints to use for the stream.
   */
  protected override async getStream(constraints: C): Promise<MediaStream> {
    const stream = await this.doGetStream(constraints);
    return this.state.audioBitrateType === AudioBitrateType.MUSIC_HIGH_QUALITY
      ? withStereoAudio(stream)
      : stream;
  }

  /**
   * Does the actual work of getting a stream with the provided constraints.
   * @param constraints the constraints to use for the stream.
   */
  protected abstract doGetStream(constraints: C): Promise<MediaStream>;

  /**
   * Applies Device Manager specific High Fidelity settings.
   */
  protected abstract doSetAudioBitrateType(
    type: AudioBitrateType,
  ): Promise<void>;
}
