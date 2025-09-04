import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { AudioBitrateType } from '../gen/video/sfu/models/models';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { RxUtils } from './../store';

/**
 * Base state class for High Fidelity enabled device managers.
 */
export abstract class AudioDeviceManagerState<
  C,
> extends InputMediaDeviceManagerState<C> {
  private audioBitrateTypeSubject = new BehaviorSubject<AudioBitrateType>(
    AudioBitrateType.VOICE_STANDARD_UNSPECIFIED,
  );

  /**
   * An Observable that emits the current audio bitrate type.
   */
  audioBitrateType$ = this.audioBitrateTypeSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /**
   * Returns the current audio bitrate type.
   */
  get audioBitrateType() {
    return RxUtils.getCurrentValue(this.audioBitrateType$);
  }

  /**
   * Sets the audio bitrate type.
   */
  setAudioBitrateType(type: AudioBitrateType) {
    RxUtils.setCurrentValue(this.audioBitrateTypeSubject, type);
  }
}
