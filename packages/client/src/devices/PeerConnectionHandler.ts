import { detectAudioLevels } from '../helpers/detect-audio-levels';
import { isReactNative } from '../helpers/platforms';
import { SoundStateChangeHandler } from '../helpers/sound-detector';

export class PeerConnectionHandler {
  private pc1: RTCPeerConnection | undefined;
  private pc2: RTCPeerConnection | undefined;

  constructor() {
    this.initializePeerConnection();
  }

  /**
   * Internal method to initialize the peer connections.
   */
  private async initializePeerConnection() {
    if (!isReactNative()) return;
    this.pc1 = new RTCPeerConnection({});
    this.pc2 = new RTCPeerConnection({});
  }

  /**
   * Public method to connect and offer negotiations between peer connections.
   * This is essential to retrieve audio stats in React Native.
   */
  public async negotiateBetweenPeerConnections() {
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
        // We need to mute the audio track for this temporary stream, or else you will hear yourself twice while in the call.
        audioTracks.forEach((track) => (track.enabled = false));
      }
    } catch (error) {
      console.error(
        'Error connecting and negotiating between PeerConnections:',
        error,
      );
    }
  }

  /**
   * Public method to cleanup and close the peer connections.
   */
  public cleanupPeerConnections() {
    if (!isReactNative()) return;
    this.pc1?.close();
    this.pc2?.close();
  }

  /**
   * Public method that detects the audio levels and returns the status.
   */
  public speakingWhileMutedDetection(
    onSoundDetectedStateChanged: SoundStateChangeHandler,
  ) {
    if (!isReactNative()) return;
    if (this.pc1) {
      return detectAudioLevels(this.pc1, onSoundDetectedStateChanged);
    }
  }
}
