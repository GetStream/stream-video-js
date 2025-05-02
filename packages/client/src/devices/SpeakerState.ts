import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { RxUtils } from '../store';
import { checkIfAudioOutputChangeSupported } from './devices';
import { tracer as mediaStatsTracer } from '../stats/rtc/mediaDevices';

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
    mediaStatsTracer.trace('navigator.mediaDevices.setSinkId', deviceId);
  }

  /**
   * @internal
   * @param volume
   */
  setVolume(volume: number) {
    RxUtils.setCurrentValue(this.volumeSubject, volume);
  }
}
