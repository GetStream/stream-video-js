import { BehaviorSubject, Observable, distinctUntilChanged } from 'rxjs';
import { RxUtils } from '../store';
import { checkIfAudioOutputChangeSupported } from './devices';

export class SpeakerState {
  protected selectedDeviceSubject = new BehaviorSubject<string>('');
  protected volumeSubject = new BehaviorSubject<number>(1);
  /**
   * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId).
   */
  readonly isDeviceSelectionSupported = checkIfAudioOutputChangeSupported();

  /**
   * An Observable that emits the currently selected device
   *
   * Note: this feature is not supported in React Native
   */
  selectedDevice$: Observable<string>;

  /**
   * An Observable that emits the currently selected volume
   *
   * Note: this feature is not supported in React Native
   */
  volume$: Observable<number>;

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
   *
   * Note: this feature is not supported in React Native
   */
  get selectedDevice() {
    return this.getCurrentValue(this.selectedDevice$);
  }

  /**
   * The currently selected volume
   *
   * Note: this feature is not supported in React Native
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
  setDevice(deviceId: string) {
    this.setCurrentValue(this.selectedDeviceSubject, deviceId);
  }

  /**
   * @internal
   * @param volume
   */
  setVolume(volume: number) {
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
