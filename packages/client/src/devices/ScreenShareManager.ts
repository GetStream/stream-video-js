import { Observable, of } from 'rxjs';
import {
  AudioDeviceManager,
  createAudioConstraints,
} from './AudioDeviceManager';
import { ScreenShareState } from './ScreenShareState';
import { Call } from '../Call';
import { AudioBitrateProfile, TrackType } from '../gen/video/sfu/models/models';
import { getScreenShareStream } from './devices';
import { ScreenShareSettings } from '../types';
import { createSubscription } from '../store/rxUtils';

export class ScreenShareManager extends AudioDeviceManager<
  ScreenShareState,
  DisplayMediaStreamOptions
> {
  constructor(call: Call) {
    super(call, new ScreenShareState(), TrackType.SCREEN_SHARE);
  }

  override setup(): void {
    super.setup();
    this.subscriptions.push(
      createSubscription(this.call.state.settings$, (settings) => {
        const maybeTargetResolution = settings?.screensharing.target_resolution;

        if (maybeTargetResolution) {
          this.setDefaultConstraints({
            ...this.state.defaultConstraints,
            video: {
              width: maybeTargetResolution.width,
              height: maybeTargetResolution.height,
            },
          });
        }
      }),
    );
  }

  /**
   * Will enable screen share audio options on supported platforms.
   *
   * Note: for ongoing screen share, audio won't be enabled until you
   * re-publish the screen share stream.
   */
  enableScreenShareAudio(): void {
    this.state.setAudioEnabled(true);
  }

  /**
   * Will disable screen share audio options on supported platforms.
   */
  async disableScreenShareAudio(): Promise<void> {
    this.state.setAudioEnabled(false);
    if (this.call.publisher?.isPublishing(TrackType.SCREEN_SHARE_AUDIO)) {
      await this.call.stopPublish(TrackType.SCREEN_SHARE_AUDIO);
    }
  }

  /**
   * Returns the current screen share settings.
   */
  getSettings(): ScreenShareSettings | undefined {
    return this.state.settings;
  }

  /**
   * Sets the current screen share settings.
   *
   * @param settings the settings to set.
   */
  setSettings(settings: ScreenShareSettings | undefined): void {
    this.state.setSettings(settings);
  }

  protected getDevices(): Observable<MediaDeviceInfo[]> {
    return of([]); // there are no devices to be listed for Screen Share
  }

  protected override async getStream(
    constraints: DisplayMediaStreamOptions,
  ): Promise<MediaStream> {
    if (!this.state.audioEnabled) {
      constraints.audio = false;
    }
    const stream = await getScreenShareStream(constraints, this.call.tracer);
    const [track] = stream.getVideoTracks();
    const { contentHint } = this.state.settings || {};
    if (typeof contentHint !== 'undefined' && track && 'contentHint' in track) {
      this.call.tracer.trace(
        'navigator.mediaDevices.getDisplayMedia.contentHint',
        contentHint,
      );
      track.contentHint = contentHint;
    }
    return stream;
  }

  protected override doSetAudioBitrateProfile(profile: AudioBitrateProfile) {
    const { defaultConstraints } = this.state;
    const baseAudioConstraints =
      typeof defaultConstraints?.audio !== 'boolean'
        ? defaultConstraints?.audio
        : null;
    this.setDefaultConstraints({
      ...defaultConstraints,
      audio: {
        ...baseAudioConstraints,
        ...createAudioConstraints(profile),
      },
    });
  }

  protected override async stopPublishStream(): Promise<void> {
    return this.call.stopPublish(
      TrackType.SCREEN_SHARE,
      TrackType.SCREEN_SHARE_AUDIO,
    );
  }

  /**
   * Overrides the default `select` method to throw an error.
   */
  override async select(): Promise<void> {
    throw new Error('Not supported');
  }
}
