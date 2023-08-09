import { Observable } from 'rxjs';
import { Call } from '../Call';
import { CameraManagerState } from './CameraManagerState';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { getVideoDevices, getVideoStream } from './devices';
import { TrackType } from '../gen/video/sfu/models/models';

export class CameraManager extends InputMediaDeviceManager<CameraManagerState> {
  constructor(call: Call) {
    super(call, new CameraManagerState());
  }

  /**
   * Flips the camera direction: if it's front it will change to back, if it's back, it will change to front.
   *
   * Note: if there is no available camera with the desired direction, this method will do nothing.
   * @returns
   */
  async flip() {
    const newDirection = this.state.direction === 'front' ? 'back' : 'front';
    this.state.setDirection(newDirection);
    // Providing both device id and direction doesn't work, so we deselect the device
    this.state.setDevice(undefined);
    await this.applySettingsToStream();
  }

  protected getDevices(): Observable<MediaDeviceInfo[]> {
    return getVideoDevices();
  }
  protected getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
    // We can't set both device id and facing mode
    // Device id has higher priority
    if (!constraints.deviceId) {
      constraints.facingMode =
        this.state.direction === 'front' ? 'user' : 'environment';
    }
    return getVideoStream(constraints);
  }
  protected publishStream(stream: MediaStream): Promise<void> {
    return this.call.publishVideoStream(stream);
  }
  protected stopPublishStream(): Promise<void> {
    return this.call.stopPublish(TrackType.VIDEO);
  }
}
