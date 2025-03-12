import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
} from 'rxjs';
import { RxUtils } from '../store';
import { BrowserPermission } from './BrowserPermission';

export type InputDeviceStatus = 'enabled' | 'disabled' | undefined;
export type TrackDisableMode = 'stop-tracks' | 'disable-tracks';

export abstract class InputMediaDeviceManagerState<C = MediaTrackConstraints> {
  protected statusSubject = new BehaviorSubject<InputDeviceStatus>(undefined);
  protected optimisticStatusSubject = new BehaviorSubject<InputDeviceStatus>(
    undefined,
  );
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
   * An Observable the reflects the requested device status. Useful for optimistic UIs
   */
  optimisticStatus$ = this.optimisticStatusSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /**
   * The default constraints for the device.
   */
  defaultConstraints$ = this.defaultConstraintsSubject.asObservable();

  /**
   * An observable that will emit `true` if browser/system permission
   * is granted, `false` otherwise.
   */
  hasBrowserPermission$: Observable<boolean>;

  /**
   * An observable that emits `true` when SDK is prompting for browser permission
   * (i.e. browser's UI for allowing or disallowing device access is visible)
   */
  isPromptingPermission$: Observable<boolean>;

  /**
   * Constructs new InputMediaDeviceManagerState instance.
   *
   * @param disableMode the disable mode to use.
   * @param permission the BrowserPermission to use for querying.
   * `undefined` means no permission is required.
   */
  constructor(
    public readonly disableMode: TrackDisableMode = 'stop-tracks',
    permission?: BrowserPermission,
  ) {
    this.hasBrowserPermission$ = permission
      ? permission.asObservable().pipe(shareReplay(1))
      : of(true);

    this.isPromptingPermission$ = permission
      ? permission.getIsPromptingObservable().pipe(shareReplay(1))
      : of(false);
  }

  /**
   * The device status
   */
  get status() {
    return this.getCurrentValue(this.status$);
  }

  /**
   * The requested device status. Useful for optimistic UIs
   */
  get optimisticStatus() {
    return this.getCurrentValue(this.optimisticStatus$);
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
   * @param pendingStatus
   */
  setPendingStatus(pendingStatus: InputDeviceStatus) {
    this.setCurrentValue(this.optimisticStatusSubject, pendingStatus);
  }

  /**
   * Updates the `mediaStream` state variable.
   *
   * @internal
   * @param stream the stream to set.
   * @param rootStream the root stream, applicable when filters are used
   * as this is the stream that holds the actual deviceId information.
   */
  setMediaStream(
    stream: MediaStream | undefined,
    rootStream: MediaStream | undefined,
  ) {
    this.setCurrentValue(this.mediaStreamSubject, stream);
    if (rootStream) {
      this.setDevice(this.getDeviceIdFromStream(rootStream));
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
