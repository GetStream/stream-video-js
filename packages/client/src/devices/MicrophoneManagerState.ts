import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import {
  InputMediaDeviceManagerState,
  TrackDisableMode,
} from './InputMediaDeviceManagerState';
import { getAudioBrowserPermission } from './devices';

export class MicrophoneManagerState extends InputMediaDeviceManagerState {
  private speakingWhileMutedSubject = new BehaviorSubject<boolean>(false);

  /**
   * An Observable that emits `true` if the user's microphone is muted but they'are speaking.
   *
   * This feature is not available in the React Native SDK.
   */
  speakingWhileMuted$: Observable<boolean>;

  constructor(disableMode: TrackDisableMode) {
    super(disableMode, getAudioBrowserPermission());

    this.speakingWhileMuted$ = this.speakingWhileMutedSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  /**
   * `true` if the user's microphone is muted but they'are speaking.
   *
   * This feature is not available in the React Native SDK.
   */
  get speakingWhileMuted() {
    return this.getCurrentValue(this.speakingWhileMuted$);
  }

  /**
   * @internal
   */
  setSpeakingWhileMuted(isSpeaking: boolean) {
    this.setCurrentValue(this.speakingWhileMutedSubject, isSpeaking);
  }

  protected getDeviceIdFromStream(stream: MediaStream): string | undefined {
    const [track] = stream.getAudioTracks();
    return track?.getSettings().deviceId;
  }
}
