import { combineLatest, Observable } from 'rxjs';
import { Call } from '../Call';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { MicrophoneManagerState } from './MicrophoneManagerState';
import { getAudioDevices, getAudioStream } from './devices';
import { TrackType } from '../gen/video/sfu/models/models';
import { createSoundDetector } from '../helpers/sound-detector';
import { isReactNative } from '../helpers/platforms';
import { OwnCapability } from '../gen/coordinator';
import { CallingState } from '../store';

export class MicrophoneManager extends InputMediaDeviceManager<MicrophoneManagerState> {
  private soundDetectorCleanup?: Function;

  constructor(call: Call) {
    super(call, new MicrophoneManagerState(), TrackType.AUDIO);

    combineLatest([
      this.call.state.callingState$,
      this.call.state.ownCapabilities$,
      this.state.selectedDevice$,
      this.state.status$,
    ]).subscribe(async ([callingState, ownCapabilities, deviceId, status]) => {
      if (callingState !== CallingState.JOINED) {
        if (callingState === CallingState.LEFT) {
          await this.stopSpeakingWhileMutedDetection();
        }
        return;
      }
      if (ownCapabilities.includes(OwnCapability.SEND_AUDIO)) {
        if (status === 'disabled') {
          await this.startSpeakingWhileMutedDetection(deviceId);
        } else {
          await this.stopSpeakingWhileMutedDetection();
        }
      } else {
        await this.stopSpeakingWhileMutedDetection();
      }
    });
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

  private async startSpeakingWhileMutedDetection(deviceId?: string) {
    if (isReactNative()) {
      return;
    }
    await this.stopSpeakingWhileMutedDetection();
    // Need to start a new stream that's not connected to publisher
    const stream = await this.getStream({
      deviceId,
    });
    this.soundDetectorCleanup = createSoundDetector(stream, (event) => {
      this.state.setSpeakingWhileMuted(event.isSoundDetected);
    });
  }

  private async stopSpeakingWhileMutedDetection() {
    if (isReactNative() || !this.soundDetectorCleanup) {
      return;
    }
    this.state.setSpeakingWhileMuted(false);
    try {
      await this.soundDetectorCleanup();
    } finally {
      this.soundDetectorCleanup = undefined;
    }
  }
}
