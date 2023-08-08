import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';

export class CameraManagerState extends InputMediaDeviceManagerState {
  private directionSubject = new BehaviorSubject<'front' | 'back'>('front');

  /**
   * Observable that emits the preferred camera direction
   * front - means the camera facing the user
   * back - means the camera facing the environment
   */
  direction$: Observable<'front' | 'back'>;

  constructor() {
    super();
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
    return this.getCurrentValue(this.direction$);
  }

  /**
   * @internal
   */
  setDirection(direction: 'front' | 'back') {
    this.setCurrentValue(this.directionSubject, direction);
  }

  /**
   * @internal
   */
  setMediaStream(stream: MediaStream | undefined): void {
    super.setMediaStream(stream);
    if (stream) {
      const direction =
        stream.getVideoTracks()[0]?.getSettings().facingMode === 'environment'
          ? 'back'
          : 'front';
      this.setDirection(direction);
    }
  }

  protected getDeviceIdFromStream(stream: MediaStream): string | undefined {
    return stream.getVideoTracks()[0]?.getSettings().deviceId as
      | string
      | undefined;
  }
}
