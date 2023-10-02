import { Observable } from 'rxjs';
import { Call } from '../Call';
import { CallingState } from '../store';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { isReactNative } from '../helpers/platforms';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { TrackType } from '../gen/video/sfu/models/models';

export abstract class InputMediaDeviceManager<
  T extends InputMediaDeviceManagerState,
> {
  /**
   * @internal
   */
  enablePromise?: Promise<void>;
  /**
   * @internal
   */
  disablePromise?: Promise<void>;
  logger: Logger;

  constructor(
    protected readonly call: Call,
    public readonly state: T,
    protected readonly trackType: TrackType,
  ) {
    this.logger = getLogger([`${TrackType[trackType].toLowerCase()} manager`]);
  }

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
    this.enablePromise = this.unmuteStream();
    try {
      await this.enablePromise;
      this.state.setStatus('enabled');
    } catch (error) {
      this.enablePromise = undefined;
      throw error;
    }
  }

  /**
   * Stops camera/microphone
   *
   * @returns
   */
  async disable() {
    this.state.prevStatus = this.state.status;
    if (this.state.status === 'disabled') {
      return;
    }
    this.disablePromise = this.muteStream(
      this.state.disableMode === 'stop-tracks',
    );
    try {
      await this.disablePromise;
      this.state.setStatus('disabled');
      this.disablePromise = undefined;
    } catch (error) {
      this.disablePromise = undefined;
      throw error;
    }
  }

  /**
   * If status was previously enabled, it will reenable the device.
   */
  async resume() {
    if (
      this.state.prevStatus === 'enabled' &&
      this.state.status === 'disabled'
    ) {
      await this.enable();
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

  protected abstract getTrack(): undefined | MediaStreamTrack;

  protected async muteStream(stopTracks: boolean = true) {
    if (!this.state.mediaStream) {
      return;
    }
    this.logger('debug', `${stopTracks ? 'Stopping' : 'Disabling'} stream`);
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.stopPublishStream(stopTracks);
    }
    this.muteLocalStream(stopTracks);
    if (this.getTrack()?.readyState === 'ended') {
      // @ts-expect-error release() is present in react-native-webrtc and must be called to dispose the stream
      if (typeof this.state.mediaStream.release === 'function') {
        // @ts-expect-error
        this.state.mediaStream.release();
      }
      this.state.setMediaStream(undefined);
    }
  }

  private muteTrack() {
    const track = this.getTrack();
    if (!track || !track.enabled) {
      return;
    }
    track.enabled = false;
  }

  private unmuteTrack() {
    const track = this.getTrack();
    if (!track || track.enabled) {
      return;
    }
    track.enabled = true;
  }

  private stopTrack() {
    const track = this.getTrack();
    if (!track || track.readyState === 'ended') {
      return;
    }
    track.stop();
  }

  private muteLocalStream(stopTracks: boolean) {
    if (!this.state.mediaStream) {
      return;
    }
    stopTracks ? this.stopTrack() : this.muteTrack();
  }

  protected async unmuteStream() {
    this.logger('debug', 'Starting stream');
    let stream: MediaStream;
    if (this.state.mediaStream && this.getTrack()?.readyState === 'live') {
      stream = this.state.mediaStream;
      this.unmuteTrack();
    } else {
      if (this.state.mediaStream) {
        this.stopTrack();
      }
      const constraints = { deviceId: this.state.selectedDevice };
      stream = await this.getStream(constraints);
    }
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.publishStream(stream);
    }
    if (this.state.mediaStream !== stream) {
      this.state.setMediaStream(stream);
    }
  }
}
