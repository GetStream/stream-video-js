import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { RxUtils } from '../store';
import { TrackDisableMode } from './DeviceManagerState';
import { AudioDeviceManagerState } from './AudioDeviceManagerState';
import { getAudioBrowserPermission, resolveDeviceId } from './devices';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { Tracer } from '../stats';

/**
 * The state of the Noise Cancellation filter.
 *
 * - `enabled`: the filter is active.
 * - `disabled`: the filter is inactive or not registered.
 * - `suspended`: the filter was turned off automatically because the device
 *   is overloaded, and it will be turned back on shortly.
 * - `overloaded`: the filter was turned off automatically because the device
 *   is overloaded, and it won't be turned back on automatically.
 */
export type NoiseCancellationStatus =
  'enabled' | 'disabled' | 'suspended' | 'overloaded';

export class MicrophoneManagerState extends AudioDeviceManagerState<MediaTrackConstraints> {
  private speakingWhileMutedSubject = new BehaviorSubject<boolean>(false);

  /**
   * An Observable that emits `true` if the user's microphone is muted, but they're speaking.
   */
  speakingWhileMuted$ = this.speakingWhileMutedSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private noiseCancellationStatusSubject =
    new BehaviorSubject<NoiseCancellationStatus>('disabled');

  /**
   * An Observable that emits the current Noise Cancellation status.
   */
  noiseCancellationStatus$ = this.noiseCancellationStatusSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor(disableMode: TrackDisableMode, tracer: Tracer | undefined) {
    super(
      disableMode,
      getAudioBrowserPermission(tracer),
      AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
    );
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

  /**
   * The current Noise Cancellation status.
   */
  get noiseCancellationStatus() {
    return RxUtils.getCurrentValue(this.noiseCancellationStatus$);
  }

  /**
   * @internal
   */
  setNoiseCancellationStatus = (status: NoiseCancellationStatus) => {
    RxUtils.setCurrentValue(this.noiseCancellationStatusSubject, status);
  };

  protected override getDeviceIdFromStream(
    stream: MediaStream,
  ): string | undefined {
    const [track] = stream.getAudioTracks();
    const unresolvedDeviceId = track?.getSettings().deviceId;
    return resolveDeviceId(unresolvedDeviceId, 'audioinput');
  }
}
