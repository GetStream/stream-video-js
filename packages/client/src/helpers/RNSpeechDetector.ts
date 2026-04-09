import { BaseStats, flatten } from '../stats';
import { SoundStateChangeHandler } from './sound-detector';
import { videoLoggerSystem } from '../logger';

export class RNSpeechDetector {
  private readonly pc1 = new RTCPeerConnection({});
  private readonly pc2 = new RTCPeerConnection({});
  private audioStream: MediaStream | undefined;
  private externalAudioStream: MediaStream | undefined;
  private isStopped = false;

  constructor(externalAudioStream?: MediaStream) {
    this.externalAudioStream = externalAudioStream;
  }

  /**
   * Starts the speech detection.
   */
  public async start(onSoundDetectedStateChanged: SoundStateChangeHandler) {
    try {
      this.isStopped = false;
      const audioStream =
        this.externalAudioStream != null
          ? this.externalAudioStream
          : await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream = audioStream;

      const onPc1IceCandidate = (e: RTCPeerConnectionIceEvent) => {
        this.forwardIceCandidate(this.pc2, e.candidate);
      };
      const onPc2IceCandidate = (e: RTCPeerConnectionIceEvent) => {
        this.forwardIceCandidate(this.pc1, e.candidate);
      };
      const onTrackPc2 = (e: RTCTrackEvent) => {
        e.streams[0].getTracks().forEach((track) => {
          // In RN, the remote track is automatically added to the audio output device
          // so we need to mute it to avoid hearing the audio back
          // @ts-expect-error _setVolume is a private method in react-native-webrtc
          track._setVolume(0);
        });
      };

      this.pc1.addEventListener('icecandidate', onPc1IceCandidate);
      this.pc2.addEventListener('icecandidate', onPc2IceCandidate);
      this.pc2.addEventListener('track', onTrackPc2);

      audioStream
        .getTracks()
        .forEach((track) => this.pc1.addTrack(track, audioStream));
      const offer = await this.pc1.createOffer({});
      await this.pc2.setRemoteDescription(offer);
      await this.pc1.setLocalDescription(offer);
      const answer = await this.pc2.createAnswer();
      await this.pc1.setRemoteDescription(answer);
      await this.pc2.setLocalDescription(answer);
      const unsubscribe = this.onSpeakingDetectedStateChange(
        onSoundDetectedStateChanged,
      );
      return () => {
        this.pc1.removeEventListener('icecandidate', onPc1IceCandidate);
        this.pc2.removeEventListener('icecandidate', onPc2IceCandidate);
        this.pc2.removeEventListener('track', onTrackPc2);
        unsubscribe();
        this.stop();
      };
    } catch (error) {
      const logger = videoLoggerSystem.getLogger('RNSpeechDetector');
      logger.error('error handling permissions: ', error);
      return () => {};
    }
  }

  /**
   * Stops the speech detection and releases all allocated resources.
   */
  private stop() {
    if (this.isStopped) return;
    this.isStopped = true;

    this.pc1.close();
    this.pc2.close();

    if (this.externalAudioStream != null) {
      this.externalAudioStream = undefined;
    } else {
      this.cleanupAudioStream();
    }
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
        const stats = await this.pc1.getStats();
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
        const logger = videoLoggerSystem.getLogger('RNSpeechDetector');
        logger.error('error checking audio level from stats', error);
      }
    };

    const intervalId = setInterval(checkAudioLevel, 250);
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

  private forwardIceCandidate(
    destination: RTCPeerConnection,
    candidate: RTCIceCandidate | null,
  ) {
    if (
      this.isStopped ||
      !candidate ||
      destination.signalingState === 'closed'
    ) {
      return;
    }
    destination.addIceCandidate(candidate).catch(() => {
      // silently ignore the error
      const logger = videoLoggerSystem.getLogger('RNSpeechDetector');
      logger.info('cannot add ice candidate - ignoring');
    });
  }
}
