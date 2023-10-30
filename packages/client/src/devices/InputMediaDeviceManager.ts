import { Observable } from 'rxjs';
import { Call } from '../Call';
import { CallingState } from '../store';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { isReactNative } from '../helpers/platforms';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { TrackType } from '../gen/video/sfu/models/models';

export abstract class InputMediaDeviceManager<
  T extends InputMediaDeviceManagerState<C>,
  C = MediaTrackConstraints,
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

  protected constructor(
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
   * Starts stream.
   */
  async enable() {
    if (this.state.status === 'enabled') return;
    this.enablePromise = this.unmuteStream();
    try {
      await this.enablePromise;
      this.state.setStatus('enabled');
      this.enablePromise = undefined;
    } catch (error) {
      this.enablePromise = undefined;
      throw error;
    }
  }

  /**
   * Stops the stream.
   */
  async disable() {
    this.state.prevStatus = this.state.status;
    if (this.state.status === 'disabled') return;
    const stopTracks = this.state.disableMode === 'stop-tracks';
    this.disablePromise = this.muteStream(stopTracks);
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
   * If status was previously enabled, it will re-enable the device.
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
   * If the current device status is disabled, it will enable the device,
   * else it will disable it.
   */
  async toggle() {
    if (this.state.status === 'enabled') {
      return this.disable();
    } else {
      return this.enable();
    }
  }

  /**
   * Will set the default constraints for the device.
   *
   * @param constraints the constraints to set.
   */
  setDefaultConstraints(constraints: C) {
    this.state.setDefaultConstraints(constraints);
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

  protected abstract getDevices(): Observable<MediaDeviceInfo[] | undefined>;

  protected abstract getStream(constraints: C): Promise<MediaStream>;

  protected abstract publishStream(stream: MediaStream): Promise<void>;

  protected abstract stopPublishStream(stopTracks: boolean): Promise<void>;

  protected getTracks(): MediaStreamTrack[] {
    return this.state.mediaStream?.getTracks() ?? [];
  }

  protected async muteStream(stopTracks: boolean = true) {
    if (!this.state.mediaStream) return;
    this.logger('debug', `${stopTracks ? 'Stopping' : 'Disabling'} stream`);
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.stopPublishStream(stopTracks);
    }
    this.muteLocalStream(stopTracks);
    const allEnded = this.getTracks().every((t) => t.readyState === 'ended');
    if (allEnded) {
      if (
        this.state.mediaStream &&
        // @ts-expect-error release() is present in react-native-webrtc
        typeof this.state.mediaStream.release === 'function'
      ) {
        // @ts-expect-error called to dispose the stream in RN
        this.state.mediaStream.release();
      }
      this.state.setMediaStream(undefined);
    }
  }

  private muteTracks() {
    this.getTracks().forEach((track) => {
      if (track.enabled) track.enabled = false;
    });
  }

  private unmuteTracks() {
    this.getTracks().forEach((track) => {
      if (!track.enabled) track.enabled = true;
    });
  }

  private stopTracks() {
    this.getTracks().forEach((track) => {
      if (track.readyState === 'live') track.stop();
    });
  }

  private muteLocalStream(stopTracks: boolean) {
    if (!this.state.mediaStream) {
      return;
    }
    if (stopTracks) {
      this.stopTracks();
    } else {
      this.muteTracks();
    }
  }

  protected async unmuteStream() {
    this.logger('debug', 'Starting stream');
    let stream: MediaStream;
    if (
      this.state.mediaStream &&
      this.getTracks().every((t) => t.readyState === 'live')
    ) {
      stream = this.state.mediaStream;
      this.unmuteTracks();
    } else {
      const defaultConstraints = this.state.defaultConstraints;
      const constraints: MediaTrackConstraints = {
        ...defaultConstraints,
        deviceId: this.state.selectedDevice,
      };
      stream = await this.getStream(constraints as C);
    }
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.publishStream(stream);
    }
    if (this.state.mediaStream !== stream) {
      this.state.setMediaStream(stream);
      this.getTracks().forEach((track) => {
        track.addEventListener('ended', async () => {
          if (this.state.status === 'disabled' || this.disablePromise) {
            return;
          }
          await this.disable();
        });
      });
    }
  }
}
