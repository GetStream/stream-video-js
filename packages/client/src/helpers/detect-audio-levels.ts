import { Observable } from 'rxjs';
import { createSubscription } from '../store/rxUtils';
import { BaseStats, CallStatsReport } from '../stats/types';
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
 * @param callStatsReport$
 * @param onSoundDetectedStateChanged
 * @returns
 */
export const detectAudioLevels = (
  callStatsReport$: Observable<CallStatsReport | undefined>,
  onSoundDetectedStateChanged: SoundStateChangeHandler,
) => {
  let cleanupSubscription: () => void;
  cleanupSubscription = createSubscription(callStatsReport$, (statsReport) => {
    if (statsReport) {
      const { publisherRawStats } = statsReport;
      if (publisherRawStats) {
        const report = flatten(publisherRawStats);

        // Audio levels are present inside stats of type `media-source` and of kind `audio`
        const audioMediaSourceStats = report.find(
          (stat) =>
            stat.type === 'media-source' &&
            (stat as RTCRtpStreamStats).kind === 'audio',
        ) as BaseStats;
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
    }
  });

  return () => {
    cleanupSubscription();
  };
};
