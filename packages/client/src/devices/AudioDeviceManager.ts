import { DeviceManager } from './DeviceManager';
import { AudioDeviceManagerState } from './AudioDeviceManagerState';
import { AudioBitrateType } from '../gen/video/sfu/models/models';

/**
 * Base class for High Fidelity enabled Device Managers.
 */
export abstract class AudioDeviceManager<
  S extends AudioDeviceManagerState<C>,
  C = MediaTrackConstraints,
> extends DeviceManager<S, C> {
  /**
   * Sets the audio bitrate type.
   * @param type the bitrate type to set.
   */
  async setAudioBitrateType(type: AudioBitrateType) {
    await this.doSetAudioBitrateType(type);
    this.state.setAudioBitrateType(type);
  }

  /**
   * Applies Device Manager's specific High Fidelity settings.
   */
  protected abstract doSetAudioBitrateType(
    type: AudioBitrateType,
  ): Promise<void>;
}
