import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';

export class MicrophoneManagerState extends InputMediaDeviceManagerState {
  private speakingWhileMutedSubject = new BehaviorSubject<boolean>(false);

  /**
   * An Observable that emits `true` if the user's microphone is muted but they'are speaking.
   *
   * This feature is not available in the React Native SDK.
   */
  speakingWhileMuted$: Observable<boolean>;

  constructor() {
    super(
      'disable-tracks',
      // `microphone` is not in the W3C standard yet,
      // but it's supported by Chrome and Safari.
      'microphone' as PermissionName,
    );

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
    return stream.getAudioTracks()[0]?.getSettings().deviceId as
      | string
      | undefined;
  }
}
