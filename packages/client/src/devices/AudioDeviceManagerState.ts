import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { DeviceManagerState, TrackDisableMode } from './DeviceManagerState';
import { RxUtils } from './../store';
import { BrowserPermission } from './BrowserPermission';

/**
 * Base state class for High Fidelity enabled device managers.
 */
export abstract class AudioDeviceManagerState<C> extends DeviceManagerState<C> {
  private readonly audioBitrateProfileSubject: BehaviorSubject<AudioBitrateProfile>;

  /** An Observable that emits the current audio bitrate profile. */
  audioBitrateProfile$: Observable<AudioBitrateProfile>;

  /**
   * Constructs a new AudioDeviceManagerState instance.
   */
  protected constructor(
    disableMode: TrackDisableMode,
    permission: BrowserPermission | undefined,
    profile: AudioBitrateProfile,
  ) {
    super(disableMode, permission);
    this.audioBitrateProfileSubject = new BehaviorSubject(profile);
    this.audioBitrateProfile$ = this.audioBitrateProfileSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  /**
   * Returns the current audio bitrate profile.
   */
  get audioBitrateProfile() {
    return RxUtils.getCurrentValue(this.audioBitrateProfile$);
  }

  /**
   * Sets the audio bitrate profile and stereo mode.
   */
  setAudioBitrateProfile(profile: AudioBitrateProfile) {
    RxUtils.setCurrentValue(this.audioBitrateProfileSubject, profile);
  }
}
