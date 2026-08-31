import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import {
  DeviceManagerState,
  type DeviceManagerStateShape,
  TrackDisableMode,
} from './DeviceManagerState';
import { BrowserPermission } from './BrowserPermission';

export type AudioDeviceStateShape = {
  audioBitrateProfile: AudioBitrateProfile;
};

/**
 * Base state class for High Fidelity enabled device managers.
 */
export abstract class AudioDeviceManagerState<
  C,
  // see the note on `DeviceManagerState`'s `Extra` default
  Extra extends Record<string, unknown> = any,
> extends DeviceManagerState<C, AudioDeviceStateShape & Extra> {
  /**
   * Constructs a new AudioDeviceManagerState instance.
   */
  protected constructor(
    disableMode: TrackDisableMode,
    permission: BrowserPermission | undefined,
    profile: AudioBitrateProfile,
    extraState: Extra = {} as Extra,
  ) {
    super(disableMode, permission, {
      audioBitrateProfile: profile,
      ...extraState,
    });
  }

  /**
   * Returns the current audio bitrate profile.
   */
  get audioBitrateProfile() {
    return this.store.getLatestValue().audioBitrateProfile;
  }

  /**
   * Sets the audio bitrate profile and stereo mode.
   */
  setAudioBitrateProfile(profile: AudioBitrateProfile) {
    this.setState({ audioBitrateProfile: profile } as Partial<
      DeviceManagerStateShape<C> & AudioDeviceStateShape & Extra
    >);
  }
}
