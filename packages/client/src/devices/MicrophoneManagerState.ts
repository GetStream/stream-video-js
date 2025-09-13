import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { RxUtils } from '../store';
import { TrackDisableMode } from './DeviceManagerState';
import { AudioDeviceManagerState } from './AudioDeviceManagerState';
import { getAudioBrowserPermission, resolveDeviceId } from './devices';

export class MicrophoneManagerState extends AudioDeviceManagerState<MediaTrackConstraints> {
  private speakingWhileMutedSubject = new BehaviorSubject<boolean>(false);

  /**
   * An Observable that emits `true` if the user's microphone is muted, but they're speaking.
   */
  speakingWhileMuted$ = this.speakingWhileMutedSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor(disableMode: TrackDisableMode) {
    super(disableMode, getAudioBrowserPermission());
  }

  /**
   * `true` if the user's microphone is muted but they're speaking.
   */
  get speakingWhileMuted() {
    return RxUtils.getCurrentValue(this.speakingWhileMuted$);
  }

  /**
   * @internal
   */
  setSpeakingWhileMuted(isSpeaking: boolean) {
    RxUtils.setCurrentValue(this.speakingWhileMutedSubject, isSpeaking);
  }

  protected override getDeviceIdFromStream(
    stream: MediaStream,
  ): string | undefined {
    const [track] = stream.getAudioTracks();
    const unresolvedDeviceId = track?.getSettings().deviceId;
    return resolveDeviceId(unresolvedDeviceId, 'audioinput');
  }
}
