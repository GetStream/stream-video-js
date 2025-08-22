import { InputMediaDeviceManager } from '../InputMediaDeviceManager';
import { HiFiDeviceManagerState } from './HiFiDeviceManagerState';
import { withHiFiAudio } from './withHiFiAudio';

/**
 * Base class for High Fidelity enabled Device Managers.
 */
export abstract class HiFiDeviceManager<
  T extends HiFiDeviceManagerState<C>,
  C = MediaTrackConstraints,
> extends InputMediaDeviceManager<T, C> {
  /**
   * Enables HiFi audio.
   */
  async enableHiFi() {
    await this.doSetHiFiEnabled(true);
    this.state.setHiFiEnabled(true);
  }

  /**
   * Disables HiFi audio.
   */
  async disableHiFi() {
    await this.doSetHiFiEnabled(false);
    this.state.setHiFiEnabled(false);
  }

  /**
   * Based on the current HiFi status, returns a stream with HiFi audio enabled.
   * @param constraints the constraints to use for the stream.
   */
  protected override async getStream(constraints: C): Promise<MediaStream> {
    const stream = await this.doGetStream(constraints);
    return this.state.hiFiEnabled ? withHiFiAudio(stream) : stream;
  }

  /**
   * Does the actual work of getting a stream with the provided constraints.
   * @param constraints the constraints to use for the stream.
   */
  protected abstract doGetStream(constraints: C): Promise<MediaStream>;

  /**
   * Applies Device Manager specific High Fidelity settings.
   */
  protected abstract doSetHiFiEnabled(enabled: boolean): Promise<void>;
}
