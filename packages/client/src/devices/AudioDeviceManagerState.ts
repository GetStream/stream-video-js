import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { DeviceManagerState } from './DeviceManagerState';
import { RxUtils } from './../store';

/**
 * Base state class for High Fidelity enabled device managers.
 */
export abstract class AudioDeviceManagerState<C> extends DeviceManagerState<C> {
  private audioBitrateProfileSubject = new BehaviorSubject<AudioBitrateProfile>(
    AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
  );
  private stereoSubject = new BehaviorSubject<boolean>(false);

  /** An Observable that emits the current audio bitrate profile. */
  audioBitrateProfile$ = this.audioBitrateProfileSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /** An Observable that emits the current stereo mode. */
  stereo$ = this.stereoSubject.asObservable().pipe(distinctUntilChanged());

  /**
   * Returns the current audio bitrate profile.
   */
  get audioBitrateProfile() {
    return RxUtils.getCurrentValue(this.audioBitrateProfile$);
  }

  /**
   * Returns the current stereo mode.
   */
  get stereo() {
    return RxUtils.getCurrentValue(this.stereo$);
  }

  /**
   * Sets the audio bitrate profile and stereo mode.
   */
  setAudioBitrateProfile(profile: AudioBitrateProfile, stereo: boolean) {
    RxUtils.setCurrentValue(this.audioBitrateProfileSubject, profile);
    RxUtils.setCurrentValue(this.stereoSubject, stereo);
  }
}
