import { Observable } from 'rxjs';
import { Call } from '../Call';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { MicrophoneManagerState } from './MicrophoneManagerState';
import { getAudioDevices, getAudioStream } from './devices';
import { TrackType } from '../gen/video/sfu/models/models';

export class MicrophoneManager extends InputMediaDeviceManager<MicrophoneManagerState> {
  constructor(call: Call) {
    super(call, new MicrophoneManagerState());
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

  protected muteTracks(): void {
    this.state.mediaStream
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = false));
  }
  protected unmuteTracks(): void {
    this.state.mediaStream?.getAudioTracks().forEach((t) => (t.enabled = true));
  }
}
