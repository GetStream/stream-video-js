import {
  DeviceManagerState,
  type DeviceManagerStateShape,
} from './DeviceManagerState';
import { isReactNative } from '../helpers/platforms';
import { getVideoBrowserPermission } from './devices';
import { field, type Subscribable } from '../store/subscribable';
import { Tracer } from '../stats';

export type CameraDirection = 'front' | 'back' | undefined;

export type CameraStateShape = { direction: CameraDirection };

export class CameraManagerState extends DeviceManagerState<
  MediaTrackConstraints,
  CameraStateShape
> {
  /**
   * The preferred camera direction
   * front - means the camera facing the user
   * back - means the camera facing the environment
   */
  readonly direction$: Subscribable<CameraDirection>;

  constructor(tracer: Tracer | undefined) {
    super('stop-tracks', getVideoBrowserPermission(tracer), {
      direction: undefined,
    });
    this.direction$ = field(this.store, 'direction');
  }

  /**
   * The preferred camera direction
   * front - means the camera facing the user
   * back - means the camera facing the environment
   */
  get direction() {
    return this.store.getLatestValue().direction;
  }

  /**
   * @internal
   */
  setDirection(direction: CameraDirection) {
    this.setState({ direction } as Partial<
      DeviceManagerStateShape<MediaTrackConstraints> & CameraStateShape
    >);
  }

  /**
   * @internal
   */
  override setMediaStream(
    stream: MediaStream | undefined,
    rootStream: MediaStream | undefined,
  ): void {
    super.setMediaStream(stream, rootStream);
    if (stream) {
      // RN getSettings() doesn't return facingMode, so we don't verify camera direction
      const direction = isReactNative()
        ? this.direction
        : stream.getVideoTracks()[0]?.getSettings().facingMode === 'environment'
          ? 'back'
          : 'front';
      this.setDirection(direction);
    }
  }

  protected override getDeviceIdFromStream(
    stream: MediaStream,
  ): string | undefined {
    const [track] = stream.getVideoTracks();
    return track?.getSettings().deviceId;
  }
}
