import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { RxUtils } from '../store';

export type InputDeviceStatus = 'enabled' | 'disabled' | undefined;

export abstract class InputMediaDeviceManagerState {
  protected statusSubject = new BehaviorSubject<InputDeviceStatus>(undefined);
  protected mediaStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  protected selectedDeviceSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  /**
   * @internal
   */
  prevStatus: InputDeviceStatus;

  /**
   * An Observable that emits the current media stream, or `undefined` if the device is currently disabled.
   *
   */
  mediaStream$: Observable<MediaStream | undefined>;

  /**
   * An Observable that emits the currently selected device
   */
  selectedDevice$: Observable<string | undefined>;

  /**
   * An Observable that emits the device status
   */
  status$: Observable<InputDeviceStatus>;

  constructor(
    public readonly disableMode:
      | 'stop-tracks'
      | 'disable-tracks' = 'stop-tracks',
  ) {
    this.mediaStream$ = this.mediaStreamSubject.asObservable();
    this.selectedDevice$ = this.selectedDeviceSubject
      .asObservable()
      .pipe(distinctUntilChanged());
    this.status$ = this.statusSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  /**
   * The device status
   */
  get status() {
    return this.getCurrentValue(this.status$);
  }

  /**
   * The currently selected device
   */
  get selectedDevice() {
    return this.getCurrentValue(this.selectedDevice$);
  }

  /**
   * The current media stream, or `undefined` if the device is currently disabled.
   */
  get mediaStream() {
    return this.getCurrentValue(this.mediaStream$);
  }

  /**
   * Gets the current value of an observable, or undefined if the observable has
   * not emitted a value yet.
   *
   * @param observable$ the observable to get the value from.
   */
  getCurrentValue = RxUtils.getCurrentValue;

  /**
   * @internal
   * @param status
   */
  setStatus(status: InputDeviceStatus) {
    this.setCurrentValue(this.statusSubject, status);
  }

  /**
   * @internal
   * @param stream
   */
  setMediaStream(stream: MediaStream | undefined) {
    this.setCurrentValue(this.mediaStreamSubject, stream);
    if (stream) {
      this.setDevice(this.getDeviceIdFromStream(stream));
    }
  }

  /**
   * @internal
   * @param stream
   */
  setDevice(deviceId: string | undefined) {
    this.setCurrentValue(this.selectedDeviceSubject, deviceId);
  }

  /**
   * Updates the value of the provided Subject.
   * An `update` can either be a new value or a function which takes
   * the current value and returns a new value.
   *
   * @internal
   *
   * @param subject the subject to update.
   * @param update the update to apply to the subject.
   * @return the updated value.
   */
  protected setCurrentValue = RxUtils.setCurrentValue;

  protected abstract getDeviceIdFromStream(
    stream: MediaStream,
  ): string | undefined;
}
