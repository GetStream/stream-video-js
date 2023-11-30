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
import { detectAudioLevels } from '../helpers/detect-audio-levels';

export class MicrophoneManager extends InputMediaDeviceManager<MicrophoneManagerState> {
  private soundDetectorCleanup?: Function;
  private pc1: RTCPeerConnection | undefined;
  private pc2: RTCPeerConnection | undefined;

  constructor(call: Call) {
    super(call, new MicrophoneManagerState(), TrackType.AUDIO);

    if (isReactNative()) {
      this.initializePeerConnection();
      this.negotiateBetweenPeerConnections();
    }

    combineLatest([
      this.call.state.callingState$,
      this.call.state.ownCapabilities$,
      this.state.selectedDevice$,
      this.state.status$,
    ]).subscribe(async ([callingState, ownCapabilities, deviceId, status]) => {
      if (callingState !== CallingState.JOINED) {
        if (callingState === CallingState.LEFT) {
          await this.stopSpeakingWhileMutedDetection();
          this.cleanupPeerConnections();
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

  private async initializePeerConnection() {
    this.pc1 = new RTCPeerConnection({});
    this.pc2 = new RTCPeerConnection({});
  }

  private async negotiateBetweenPeerConnections() {
    if (!isReactNative()) return;
    try {
      if (this.pc1 && this.pc2) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        this.pc1.addEventListener('icecandidate', async (e) => {
          await this.pc2?.addIceCandidate(
            e.candidate as RTCIceCandidateInit | undefined,
          );
        });
        this.pc2.addEventListener('icecandidate', async (e) => {
          await this.pc1?.addIceCandidate(
            e.candidate as RTCIceCandidateInit | undefined,
          );
        });

        audioStream
          .getTracks()
          .forEach((track) => this.pc1?.addTrack(track, audioStream));
        const offer = await this.pc1.createOffer({});
        await this.pc2.setRemoteDescription(offer);
        await this.pc1.setLocalDescription(offer);
        const answer = await this.pc2.createAnswer();
        await this.pc1.setRemoteDescription(answer);
        await this.pc2.setLocalDescription(answer);
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach((track) => (track.enabled = false));
      }
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  }

  private cleanupPeerConnections() {
    if (!isReactNative()) return;
    this.pc1?.close();
    this.pc2?.close();
  }

  private async startSpeakingWhileMutedDetection(deviceId?: string) {
    await this.stopSpeakingWhileMutedDetection();

    if (isReactNative() && this.pc1) {
      this.soundDetectorCleanup = detectAudioLevels(this.pc1, (event) => {
        this.state.setSpeakingWhileMuted(event.isSoundDetected);
      });
    } else {
      // Need to start a new stream that's not connected to publisher
      const stream = await this.getStream({
        deviceId,
      });
      this.soundDetectorCleanup = createSoundDetector(stream, (event) => {
        this.state.setSpeakingWhileMuted(event.isSoundDetected);
      });
    }
  }

  private async stopSpeakingWhileMutedDetection() {
    if (!this.soundDetectorCleanup) {
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
