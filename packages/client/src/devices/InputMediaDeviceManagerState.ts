import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
} from 'rxjs';
import { isReactNative } from '../helpers/platforms';
import { RxUtils } from '../store';

export type InputDeviceStatus = 'enabled' | 'disabled' | undefined;

export abstract class InputMediaDeviceManagerState<C = MediaTrackConstraints> {
  protected statusSubject = new BehaviorSubject<InputDeviceStatus>(undefined);
  protected mediaStreamSubject = new BehaviorSubject<MediaStream | undefined>(
    undefined,
  );
  protected selectedDeviceSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  protected defaultConstraintsSubject = new BehaviorSubject<C | undefined>(
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
  mediaStream$ = this.mediaStreamSubject.asObservable();

  /**
   * An Observable that emits the currently selected device
   */
  selectedDevice$ = this.selectedDeviceSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /**
   * An Observable that emits the device status
   */
  status$ = this.statusSubject.asObservable().pipe(distinctUntilChanged());

  /**
   * The default constraints for the device.
   */
  defaultConstraints$ = this.defaultConstraintsSubject.asObservable();

  /**
   * An observable that will emit `true` if browser/system permission
   * is granted, `false` otherwise.
   */
  hasBrowserPermission$ = new Observable<boolean>((subscriber) => {
    const notifyGranted = () => subscriber.next(true);
    if (isReactNative() || !this.permissionName) return notifyGranted();

    let permissionState: PermissionStatus;
    const notify = () => subscriber.next(permissionState.state === 'granted');
    navigator.permissions
      .query({ name: this.permissionName })
      .then((permissionStatus) => {
        permissionState = permissionStatus;
        permissionState.addEventListener('change', notify);
        notify();
      })
      .catch(() => {
        // permission doesn't exist or can't be queried -> assume it's granted
        // an example would be Firefox,
        // where neither camera microphone permission can be queried
        notifyGranted();
      });

    return () => {
      permissionState?.removeEventListener('change', notify);
    };
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  /**
   * Constructs new InputMediaDeviceManagerState instance.
   *
   * @param disableMode the disable mode to use.
   * @param permissionName the permission name to use for querying.
   * `undefined` means no permission is required.
   */
  constructor(
    public readonly disableMode:
      | 'stop-tracks'
      | 'disable-tracks' = 'stop-tracks',
    private readonly permissionName: PermissionName | undefined = undefined,
  ) {}

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
   * @param stream the stream to set.
   */
  setMediaStream(stream: MediaStream | undefined) {
    this.setCurrentValue(this.mediaStreamSubject, stream);
    if (stream) {
      this.setDevice(this.getDeviceIdFromStream(stream));
    }
  }

  /**
   * @internal
   * @param deviceId the device id to set.
   */
  setDevice(deviceId: string | undefined) {
    this.setCurrentValue(this.selectedDeviceSubject, deviceId);
  }

  /**
   * Gets the default constraints for the device.
   */
  get defaultConstraints() {
    return this.getCurrentValue(this.defaultConstraints$);
  }

  /**
   * Sets the default constraints for the device.
   *
   * @internal
   * @param constraints the constraints to set.
   */
  setDefaultConstraints(constraints: C | undefined) {
    this.setCurrentValue(this.defaultConstraintsSubject, constraints);
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
