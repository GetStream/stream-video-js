import {
  type AudioDeviceStateShape,
  AudioDeviceManagerState,
} from './AudioDeviceManagerState';
import type { DeviceManagerStateShape } from './DeviceManagerState';
import { AudioBitrateProfile } from '../gen/video/sfu/models/models';
import { ScreenShareSettings } from '../types';
import { field, type Subscribable } from '../store/subscribable';

export type ScreenShareStateShape = {
  audioEnabled: boolean;
  screenShareSettings: ScreenShareSettings | undefined;
};

export class ScreenShareState extends AudioDeviceManagerState<
  DisplayMediaStreamOptions,
  ScreenShareStateShape
> {
  /**
   * The current screen share audio status.
   */
  readonly audioEnabled$: Subscribable<boolean>;

  /**
   * The current screen share settings.
   */
  readonly settings$: Subscribable<ScreenShareSettings | undefined>;

  /**
   * Constructs a new ScreenShareState instance.
   */
  constructor() {
    super('stop-tracks', undefined, AudioBitrateProfile.MUSIC_HIGH_QUALITY, {
      audioEnabled: true,
      screenShareSettings: undefined,
    });
    this.audioEnabled$ = field(this.store, 'audioEnabled');
    this.settings$ = field(this.store, 'screenShareSettings');
  }

  /**
   * @internal
   */
  protected override getDeviceIdFromStream = (
    stream: MediaStream,
  ): string | undefined => {
    const [track] = stream.getTracks();
    return track?.getSettings().deviceId;
  };

  /**
   * The current screen share audio status.
   */
  get audioEnabled() {
    return this.store.getLatestValue().audioEnabled;
  }

  /**
   * Set the current screen share audio status.
   */
  setAudioEnabled(isEnabled: boolean) {
    this.setState({ audioEnabled: isEnabled } as Partial<
      DeviceManagerStateShape<DisplayMediaStreamOptions> &
        AudioDeviceStateShape &
        ScreenShareStateShape
    >);
  }

  /**
   * The current screen share settings.
   */
  get settings() {
    return this.store.getLatestValue().screenShareSettings;
  }

  /**
   * Set the current screen share settings.
   *
   * @param settings the screen share settings to set.
   */
  setSettings(settings: ScreenShareSettings | undefined) {
    this.setState({ screenShareSettings: settings } as Partial<
      DeviceManagerStateShape<DisplayMediaStreamOptions> &
        AudioDeviceStateShape &
        ScreenShareStateShape
    >);
  }
}
