import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { RxUtils } from '../store';
import { checkIfAudioOutputChangeSupported } from './devices';
import { Tracer } from '../stats';

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
  selectedDevice$ = this.selectedDeviceSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /**
   * An Observable that emits the currently selected volume
   *
   * Note: this feature is not supported in React Native
   */
  volume$ = this.volumeSubject.asObservable().pipe(distinctUntilChanged());

  constructor(private tracer: Tracer) {}

  /**
   * The currently selected device
   *
   * Note: this feature is not supported in React Native
   */
  get selectedDevice() {
    return RxUtils.getCurrentValue(this.selectedDevice$);
  }

  /**
   * The currently selected volume
   *
   * Note: this feature is not supported in React Native
   */
  get volume() {
    return RxUtils.getCurrentValue(this.volume$);
  }

  /**
   * @internal
   * @param deviceId
   */
  setDevice(deviceId: string) {
    RxUtils.setCurrentValue(this.selectedDeviceSubject, deviceId);
    this.tracer.trace('navigator.mediaDevices.setSinkId', deviceId);
  }

  /**
   * @internal
   * @param volume
   */
  setVolume(volume: number) {
    RxUtils.setCurrentValue(this.volumeSubject, volume);
  }
}
