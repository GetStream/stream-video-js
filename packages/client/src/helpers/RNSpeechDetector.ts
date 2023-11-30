import { BaseStats } from '../stats/types';
import { SoundStateChangeHandler } from './sound-detector';

/**
 * Flatten the stats report into an array of stats objects.
 *
 * @param report the report to flatten.
 */
const flatten = (report: RTCStatsReport) => {
  const stats: RTCStats[] = [];
  report.forEach((s) => {
    stats.push(s);
  });
  return stats;
};

const AUDIO_LEVEL_THRESHOLD = 0.2;

export class RNSpeechDetector {
  private pc1 = new RTCPeerConnection({});
  private pc2 = new RTCPeerConnection({});
  private intervalId: NodeJS.Timer | undefined;

  /**
   * Starts the speech detection.
   */
  public async start() {
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
   * Stops the speech detection and releases all allocated resources.
   */
  public stop() {
    this.pc1?.close();
    this.pc2?.close();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Public method that detects the audio levels and returns the status.
   */
  public onSpeakingDetectedStateChange(
    onSoundDetectedStateChanged: SoundStateChangeHandler,
  ) {
    this.intervalId = setInterval(async () => {
      const stats = (await this.pc1?.getStats()) as RTCStatsReport;
      const report = flatten(stats);
      // Audio levels are present inside stats of type `media-source` and of kind `audio`
      const audioMediaSourceStats = report.find(
        (stat) =>
          stat.type === 'media-source' &&
          (stat as RTCRtpStreamStats).kind === 'audio',
      ) as BaseStats;
      if (audioMediaSourceStats) {
        const { audioLevel } = audioMediaSourceStats;
        if (audioLevel) {
          if (audioLevel >= AUDIO_LEVEL_THRESHOLD) {
            onSoundDetectedStateChanged({
              isSoundDetected: true,
              audioLevel,
            });
          } else {
            onSoundDetectedStateChanged({
              isSoundDetected: false,
              audioLevel: 0,
            });
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(this.intervalId);
    };
  }
}
