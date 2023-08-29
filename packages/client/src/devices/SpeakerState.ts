import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { RxUtils } from '../store';

export class SpeakerState {
  protected selectedDeviceSubject = new BehaviorSubject<string | undefined>(
    undefined,
  );
  protected volumeSubject = new BehaviorSubject<undefined | number>(undefined);

  /**
   * An Observable that emits the currently selected device
   */
  selectedDevice$: Observable<string | undefined>;

  /**
   * An Observable that emits the currently selected volume
   */
  volume$: Observable<number | undefined>;

  constructor() {
    this.selectedDevice$ = this.selectedDeviceSubject
      .asObservable()
      .pipe(distinctUntilChanged());
    this.volume$ = this.volumeSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  /**
   * The currently selected device
   */
  get selectedDevice() {
    return this.getCurrentValue(this.selectedDevice$);
  }

  /**
   * The currently selected volume
   */
  get volume() {
    return this.getCurrentValue(this.volume$);
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
   * @param deviceId
   */
  setDevice(deviceId: string | undefined) {
    this.setCurrentValue(this.selectedDeviceSubject, deviceId);
  }

  /**
   * @internal
   * @param volume
   */
  setVolume(volume: number | undefined) {
    this.setCurrentValue(this.volumeSubject, volume);
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
}
