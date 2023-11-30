import { BaseStats } from '../stats/types';
import { SoundStateChangeHandler } from './sound-detector';

const AUDIO_LEVEL_THRESHOLD = 0.2;

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

/**
 * Function to detect audioLevels from the raw stats.
 * @param stats
 * @param onSoundDetectedStateChanged
 * @returns
 */
export const detectAudioLevels = (
  peerConnection: RTCPeerConnection,
  onSoundDetectedStateChanged: SoundStateChangeHandler,
) => {
  const intervalId = setInterval(async () => {
    const stats = (await peerConnection?.getStats()) as RTCStatsReport;
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
          onSoundDetectedStateChanged({ isSoundDetected: true, audioLevel });
        } else {
          onSoundDetectedStateChanged({
            isSoundDetected: false,
            audioLevel: 0,
          });
        }
      }
    }
  }, 1000);

  return function stop() {
    clearInterval(intervalId);
  };
};
