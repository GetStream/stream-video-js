import { BehaviorSubject } from 'rxjs';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { distinctUntilChanged } from 'rxjs/operators';
import { ScreenShareSettings } from '../types';

export class ScreenShareState extends InputMediaDeviceManagerState<DisplayMediaStreamOptions> {
  private audioEnabledSubject = new BehaviorSubject<boolean>(true);
  private settingsSubject = new BehaviorSubject<
    ScreenShareSettings | undefined
  >(undefined);

  /**
   * An Observable that emits the current screen share audio status.
   */
  audioEnabled$ = this.audioEnabledSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /**
   * An Observable that emits the current screen share settings.
   */
  settings$ = this.settingsSubject.asObservable();

  /**
   * @internal
   */
  protected getDeviceIdFromStream = (
    stream: MediaStream,
  ): string | undefined => {
    const [track] = stream.getTracks();
    return track?.getSettings().deviceId;
  };

  /**
   * The current screen share audio status.
   */
  get audioEnabled() {
    return this.getCurrentValue(this.audioEnabled$);
  }

  /**
   * Set the current screen share audio status.
   */
  setAudioEnabled(isEnabled: boolean) {
    this.setCurrentValue(this.audioEnabledSubject, isEnabled);
  }

  /**
   * The current screen share settings.
   */
  get settings() {
    return this.getCurrentValue(this.settings$);
  }

  /**
   * Set the current screen share settings.
   *
   * @param settings the screen share settings to set.
   */
  setSettings(settings: ScreenShareSettings | undefined) {
    this.setCurrentValue(this.settingsSubject, settings);
  }
}
