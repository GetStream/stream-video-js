import { Call } from '../Call';
import { TrackType } from '../gen/video/sfu/models/models';
import { CallingState } from '../store';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import {
  disposeOfMediaStream,
  getAudioDevices,
  getAudioStream,
  getVideoDevices,
  getVideoStream,
} from './devices';

export class InputMediaDeviceManager {
  readonly state = new InputMediaDeviceManagerState();

  constructor(
    private readonly call: Call,
    private readonly kind: Omit<MediaDeviceKind, 'audiooutput'>,
  ) {}

  /**
   * Lists the available audio/video devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   *
   * @returns an Observable that will be updated if a device is connected or disconnected
   */
  listDevices() {
    return this.kind === 'videoinput' ? getVideoDevices() : getAudioDevices();
  }

  /**
   * Starts camera/microphone
   */
  async enable() {
    if (this.state.mediaStream) {
      return;
    }
    const constraints = { deviceId: this.state.selectedDevice };
    const stream = await (this.kind === 'videoinput'
      ? getVideoStream(constraints)
      : getAudioStream(constraints));
    if (this.call.state.callingState === CallingState.JOINED) {
      await (this.kind === 'videoinput'
        ? this.call.publishVideoStream(stream)
        : this.call.publishAudioStream(stream));
    }
    this.state.setMediaStream(stream);
  }

  /**
   * Stops camera/microphone
   * @returns
   */
  async disable() {
    if (!this.state.mediaStream) {
      return;
    }
    if (this.call.state.callingState === CallingState.JOINED) {
      await (this.kind === 'videoinput'
        ? this.call.stopPublish(TrackType.VIDEO)
        : this.call.stopPublish(TrackType.AUDIO));
    } else {
      disposeOfMediaStream(this.state.mediaStream);
    }
    this.state.setMediaStream(undefined);
  }

  /**
   * If current device statis is disabled, it will enable the device, else it will disable it.
   * @returns
   */
  async toggle() {
    if (this.state.status === 'disabled') {
      return this.enable();
    } else {
      return this.disable();
    }
  }

  /**
   * Select device
   * @param deviceId
   */
  async select(deviceId: string | undefined) {
    this.state.setDevice(deviceId);
    if (this.state.status === 'enabled') {
      await this.disable();
      return this.enable();
    }
  }
}
