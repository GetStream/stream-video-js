import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { isReactNative } from '../helpers/platforms';
import { getVideoBrowserPermission } from './devices';
import { RxUtils } from '../store';

export type CameraDirection = 'front' | 'back' | undefined;

export class CameraManagerState extends InputMediaDeviceManagerState {
  private directionSubject = new BehaviorSubject<CameraDirection>(undefined);

  /**
   * Observable that emits the preferred camera direction
   * front - means the camera facing the user
   * back - means the camera facing the environment
   */
  direction$: Observable<CameraDirection>;

  constructor() {
    super('stop-tracks', getVideoBrowserPermission());
    this.direction$ = this.directionSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  /**
   * The preferred camera direction
   * front - means the camera facing the user
   * back - means the camera facing the environment
   */
  get direction() {
    return RxUtils.getCurrentValue(this.direction$);
  }

  /**
   * @internal
   */
  setDirection(direction: CameraDirection) {
    RxUtils.setCurrentValue(this.directionSubject, direction);
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

  protected getDeviceIdFromStream(stream: MediaStream): string | undefined {
    const [track] = stream.getVideoTracks();
    return track?.getSettings().deviceId;
  }
}
