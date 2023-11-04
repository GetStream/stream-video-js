import { Observable, Subscription, combineLatest, pairwise, take } from 'rxjs';
import { Call } from '../Call';
import { CallingState } from '../store';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { isReactNative } from '../helpers/platforms';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { TrackType } from '../gen/video/sfu/models/models';
import { deviceIds$ } from './devices';

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
  private subscriptions: Subscription[] = [];
  private trackEndedTimeout: any;

  protected constructor(
    protected readonly call: Call,
    public readonly state: T,
    protected readonly trackType: TrackType,
  ) {
    this.logger = getLogger([`${TrackType[trackType].toLowerCase()} manager`]);
    if (
      deviceIds$ &&
      !isReactNative() &&
      (this.trackType === TrackType.AUDIO || this.trackType === TrackType.VIDEO)
    ) {
      this.handleDisconnectedOrReplacedDevices();
    }
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

  removeSubscriptions = () => {
    this.subscriptions.forEach((s) => s.unsubscribe());
  };

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
          // Wait before disable, maybe the device was replaced not disconnected
          this.trackEndedTimeout = setTimeout(async () => {
            await this.disable();
          }, 200);
        });
      });
    }
  }

  private get mediaDeviceKind() {
    if (this.trackType === TrackType.AUDIO) {
      return 'audioinput';
    }
    if (this.trackType === TrackType.VIDEO) {
      return 'videoinput';
    }
  }

  private handleDisconnectedOrReplacedDevices() {
    this.subscriptions.push(
      combineLatest([
        deviceIds$!.pipe(pairwise()),
        this.state.selectedDevice$,
      ]).subscribe(async ([[prevDevices, currentDevices], deviceId]) => {
        if (!deviceId) {
          return;
        }
        if (this.enablePromise) {
          await this.enablePromise;
        }
        if (this.disablePromise) {
          await this.disablePromise;
        }

        let isDeviceDisconnected = false;
        let isDeviceReplaced = false;
        const currentDevice = this.findDeviceInList(currentDevices, deviceId);
        const prevDevice = this.findDeviceInList(prevDevices, deviceId);
        if (!currentDevice && prevDevice) {
          isDeviceDisconnected = true;
        } else if (
          currentDevice &&
          prevDevice &&
          currentDevice.deviceId === prevDevice.deviceId &&
          currentDevice.groupId !== prevDevice.groupId
        ) {
          isDeviceReplaced = true;
        }

        if (isDeviceDisconnected) {
          await this.disable();
          this.select(undefined);
        }
        if (isDeviceReplaced) {
          clearTimeout(this.trackEndedTimeout);
          await this.applySettingsToStream();
        }
      }),
    );
  }

  private findDeviceInList(devices: MediaDeviceInfo[], deviceId: string) {
    return devices.find(
      (d) => d.deviceId === deviceId && d.kind == this.mediaDeviceKind,
    );
  }
}
