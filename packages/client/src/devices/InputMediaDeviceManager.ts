import { Observable } from 'rxjs';
import { Call } from '../Call';
import { CallingState } from '../store';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { disposeOfMediaStream } from './devices';
import { isReactNative } from '../helpers/platforms';

export abstract class InputMediaDeviceManager<
  T extends InputMediaDeviceManagerState,
> {
  constructor(protected readonly call: Call, public readonly state: T) {}

  /**
   * Lists the available audio/video devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   *
   * @returns an Observable that will be updated if a device is connected or disconnected
   */
  listDevices() {
    return this.getDevices();
  }

  /**
   * Starts camera/microphone
   */
  async enable() {
    if (this.state.status === 'enabled') {
      return;
    }
    await this.unmuteStream();
    this.state.setStatus('enabled');
  }

  /**
   * Stops camera/microphone
   *
   * @returns
   */
  async disable() {
    if (this.state.status === 'disabled') {
      return;
    }
    this.state.prevStatus = this.state.status;
    await this.muteStream(this.state.disableMode === 'stop-tracks');
    this.state.setStatus('disabled');
  }

  /**
   * If status was previously enabled, it will reenable the device.
   */
  async resume() {
    if (
      this.state.prevStatus === 'enabled' &&
      this.state.status === 'disabled'
    ) {
      this.enable();
    }
  }

  /**
   * If current device statis is disabled, it will enable the device, else it will disable it.
   *
   * @returns
   */
  async toggle() {
    if (this.state.status === 'enabled') {
      return this.disable();
    } else {
      return this.enable();
    }
  }

  /**
   * Select device
   *
   * Note: this method is not supported in React Native
   *
   * @param deviceId
   */
  async select(deviceId: string | undefined) {
    if (isReactNative()) {
      throw new Error('This method is not supported in React Native');
    }
    if (deviceId === this.state.selectedDevice) {
      return;
    }
    this.state.setDevice(deviceId);
    await this.applySettingsToStream();
  }

  protected async applySettingsToStream() {
    if (this.state.status === 'enabled') {
      await this.muteStream();
      await this.unmuteStream();
    }
  }

  protected abstract getDevices(): Observable<MediaDeviceInfo[]>;

  protected abstract getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream>;

  protected abstract publishStream(stream: MediaStream): Promise<void>;

  protected abstract stopPublishStream(stopTracks: boolean): Promise<void>;

  protected abstract muteTracks(): void;

  protected abstract unmuteTracks(): void;

  private async muteStream(stopTracks: boolean = true) {
    if (!this.state.mediaStream) {
      return;
    }
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.stopPublishStream(stopTracks);
    } else if (this.state.mediaStream) {
      stopTracks
        ? disposeOfMediaStream(this.state.mediaStream)
        : this.muteTracks();
    }
    if (stopTracks) {
      this.state.setMediaStream(undefined);
    }
  }

  private async unmuteStream() {
    let stream: MediaStream;
    if (this.state.mediaStream) {
      stream = this.state.mediaStream;
      this.unmuteTracks();
    } else {
      const constraints = { deviceId: this.state.selectedDevice };
      stream = await this.getStream(constraints);
    }
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.publishStream(stream);
    }
    this.state.setMediaStream(stream);
  }
}
