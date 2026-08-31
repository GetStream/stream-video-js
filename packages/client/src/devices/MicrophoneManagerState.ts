import {
  type DeviceManagerStateShape,
  TrackDisableMode,
} from './DeviceManagerState';
import {
  type AudioDeviceStateShape,
  AudioDeviceManagerState,
} from './AudioDeviceManagerState';
import { getAudioBrowserPermission, resolveDeviceId } from './devices';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { Tracer } from '../stats';

export type MicrophoneStateShape = { speakingWhileMuted: boolean };

export class MicrophoneManagerState extends AudioDeviceManagerState<
  MediaTrackConstraints,
  MicrophoneStateShape
> {
  constructor(disableMode: TrackDisableMode, tracer: Tracer | undefined) {
    super(
      disableMode,
      getAudioBrowserPermission(tracer),
      AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
      { speakingWhileMuted: false },
    );
  }

  /**
   * `true` if the user's microphone is muted but they're speaking.
   */
  get speakingWhileMuted() {
    return this.store.getLatestValue().speakingWhileMuted;
  }

  /**
   * @internal
   */
  setSpeakingWhileMuted(isSpeaking: boolean) {
    this.setState({ speakingWhileMuted: isSpeaking } as Partial<
      DeviceManagerStateShape<MediaTrackConstraints> &
        AudioDeviceStateShape &
        MicrophoneStateShape
    >);
  }

  protected override getDeviceIdFromStream(
    stream: MediaStream,
  ): string | undefined {
    const [track] = stream.getAudioTracks();
    const unresolvedDeviceId = track?.getSettings().deviceId;
    return resolveDeviceId(unresolvedDeviceId, 'audioinput');
  }
}
