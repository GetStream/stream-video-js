import { Observable } from 'rxjs';
import { Call } from '../Call';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { MicrophoneManagerState } from './MicrophoneManagerState';
import { getAudioDevices, getAudioStream } from './devices';
import { TrackType } from '../gen/video/sfu/models/models';
import { createSoundDetector } from '../helpers/sound-detector';
import { isReactNative } from '../helpers/platforms';

export class MicrophoneManager extends InputMediaDeviceManager<MicrophoneManagerState> {
  private soundDetectorCleanup?: Function;

  constructor(call: Call) {
    super(call, new MicrophoneManagerState(), TrackType.AUDIO);
  }

  protected getDevices(): Observable<MediaDeviceInfo[]> {
    return getAudioDevices();
  }
  protected getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
    return getAudioStream(constraints);
  }
  protected publishStream(stream: MediaStream): Promise<void> {
    return this.call.publishAudioStream(stream);
  }
  protected stopPublishStream(stopTracks: boolean): Promise<void> {
    return this.call.stopPublish(TrackType.AUDIO, stopTracks);
  }

  protected getTrack() {
    return this.state.mediaStream?.getAudioTracks()[0];
  }

  protected async unmuteStream(): Promise<void> {
    await super.unmuteStream();
    if (isReactNative()) {
      return;
    }
    this.state.setSpeakingWhileMuted(false);
    this.soundDetectorCleanup?.().finally(
      () => (this.soundDetectorCleanup = undefined),
    );
  }

  protected async muteStream(stopTracks?: boolean): Promise<void> {
    await super.muteStream(stopTracks);
    if (isReactNative()) {
      return;
    }
    if (
      this.state.mediaStream &&
      this.getTrack()?.readyState === 'live' &&
      !this.getTrack()?.enabled
    ) {
      // Need to start a new stream that's not connected to publisher
      const stream = await this.getStream({
        deviceId: this.state.selectedDevice,
      });
      await this.soundDetectorCleanup?.().finally(
        () => (this.soundDetectorCleanup = undefined),
      );
      this.soundDetectorCleanup = createSoundDetector(stream, (event) => {
        this.state.setSpeakingWhileMuted(event.isSoundDetected);
      });
    } else {
      this.soundDetectorCleanup?.().finally(
        () => (this.soundDetectorCleanup = undefined),
      );
      this.state.setSpeakingWhileMuted(false);
    }
  }
}
