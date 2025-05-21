import { BaseStats } from '../stats';
import { SoundStateChangeHandler } from './sound-detector';
import { flatten } from '../stats/utils';
import { getLogger } from '../logger';

export class RNSpeechDetector {
  private pc1 = new RTCPeerConnection({});
  private pc2 = new RTCPeerConnection({});
  private audioStream: MediaStream | undefined;

  /**
   * Starts the speech detection.
   */
  public async start(onSoundDetectedStateChanged: SoundStateChangeHandler) {
    try {
      this.cleanupAudioStream();
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.audioStream = audioStream;

      this.pc1.addEventListener('icecandidate', async (e) => {
        await this.pc2.addIceCandidate(
          e.candidate as RTCIceCandidateInit | undefined,
        );
      });
      this.pc2.addEventListener('icecandidate', async (e) => {
        await this.pc1.addIceCandidate(
          e.candidate as RTCIceCandidateInit | undefined,
        );
      });
      this.pc2.addEventListener('track', (e) => {
        e.streams[0].getTracks().forEach((track) => {
          // In RN, the remote track is automatically added to the audio output device
          // so we need to mute it to avoid hearing the audio back
          // @ts-expect-error _setVolume is a private method in react-native-webrtc
          track._setVolume(0);
        });
      });

      audioStream
        .getTracks()
        .forEach((track) => this.pc1.addTrack(track, audioStream));
      const offer = await this.pc1.createOffer({});
      await this.pc2.setRemoteDescription(offer);
      await this.pc1.setLocalDescription(offer);
      const answer = await this.pc2.createAnswer();
      await this.pc1.setRemoteDescription(answer);
      await this.pc2.setLocalDescription(answer);
      const unsub = this.onSpeakingDetectedStateChange(
        onSoundDetectedStateChanged,
      );
      return () => {
        unsub();
        this.stop();
      };
    } catch (error) {
      const logger = getLogger(['RNSpeechDetector']);
      logger('error', 'error handling permissions: ', error);
      return () => {};
    }
  }

  /**
   * Stops the speech detection and releases all allocated resources.
   */
  private stop() {
    this.pc1.close();
    this.pc2.close();
    this.cleanupAudioStream();
  }

  /**
   * Public method that detects the audio levels and returns the status.
   */
  private onSpeakingDetectedStateChange(
    onSoundDetectedStateChanged: SoundStateChangeHandler,
  ) {
    const initialBaselineNoiseLevel = 0.13;
    let baselineNoiseLevel = initialBaselineNoiseLevel;
    let speechDetected = false;
    let speechTimer: NodeJS.Timeout | undefined;
    let silenceTimer: NodeJS.Timeout | undefined;
    const audioLevelHistory: number[] = []; // Store recent audio levels for smoother detection
    const historyLength = 10;
    const silenceThreshold = 1.1;
    const resetThreshold = 0.9;
    const speechTimeout = 500; // Speech is set to true after 500ms of audio detection
    const silenceTimeout = 5000; // Reset baseline after 5 seconds of silence

    const checkAudioLevel = async () => {
      try {
        const stats = (await this.pc1.getStats()) as RTCStatsReport;
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
            // Update audio level history (with max historyLength sized array)
            audioLevelHistory.push(audioLevel);
            if (audioLevelHistory.length > historyLength) {
              audioLevelHistory.shift();
            }

            // Calculate average audio level
            const avgAudioLevel =
              audioLevelHistory.reduce((a, b) => a + b, 0) /
              audioLevelHistory.length;

            // Update baseline (if necessary) based on silence detection
            if (avgAudioLevel < baselineNoiseLevel * silenceThreshold) {
              if (!silenceTimer) {
                silenceTimer = setTimeout(() => {
                  baselineNoiseLevel = Math.min(
                    avgAudioLevel * resetThreshold,
                    initialBaselineNoiseLevel,
                  );
                }, silenceTimeout);
              }
            } else {
              clearTimeout(silenceTimer);
              silenceTimer = undefined;
            }

            // Speech detection with hysteresis
            if (avgAudioLevel > baselineNoiseLevel * 1.5) {
              if (!speechDetected) {
                speechDetected = true;
                onSoundDetectedStateChanged({
                  isSoundDetected: true,
                  audioLevel,
                });
              }

              clearTimeout(speechTimer);

              speechTimer = setTimeout(() => {
                speechDetected = false;
                onSoundDetectedStateChanged({
                  isSoundDetected: false,
                  audioLevel: 0,
                });
              }, speechTimeout);
            }
          }
        }
      } catch (error) {
        const logger = getLogger(['RNSpeechDetector']);
        logger('error', 'error checking audio level from stats', error);
      }
    };

    // Call checkAudioLevel periodically (every 100ms)
    const intervalId = setInterval(checkAudioLevel, 100);

    return () => {
      clearInterval(intervalId);
      clearTimeout(speechTimer);
      clearTimeout(silenceTimer);
    };
  }

  private cleanupAudioStream() {
    if (!this.audioStream) {
      return;
    }
    this.audioStream.getTracks().forEach((track) => track.stop());
    if (
      // @ts-expect-error release() is present in react-native-webrtc
      typeof this.audioStream.release === 'function'
    ) {
      // @ts-expect-error called to dispose the stream in RN
      this.audioStream.release();
    }
  }
}
