import { AggregatedStatsReport } from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

const ALPHA = 0.2;
const FPS_WARNING_THRESHOLD_LOWER = 23;
const FPS_WARNING_THRESHOLD_UPPER = 25;
const DEFAULT_FPS = 30;
const DEVIATION_LIMIT = 0.5;
const OUTLIER_PERSISTENCE = 5;

/**
 * Monitors FPS and shows a warning when performance stays low.
 *
 * Smooths out quick spikes using an EMA, ignores brief outliers,
 * and uses two thresholds to avoid flickering near the limit.
 *
 * @param stats - Aggregated call stats containing FPS data.
 * @returns True when the smoothed FPS stays below the warning threshold.
 */
export function useLowFpsWarning(stats?: AggregatedStatsReport): boolean {
  const [lowFps, setLowFps] = useState<boolean>(false);
  const emaRef = useRef<number>(DEFAULT_FPS);
  const outlierStreakRef = useRef<number>(0);

  const { highestFramesPerSecond, timestamp } = stats ?? {};

  useEffect(() => {
    if (!highestFramesPerSecond) {
      emaRef.current = DEFAULT_FPS;
      outlierStreakRef.current = 0;
      setLowFps(false);
      return;
    }

    const prevEma = emaRef.current;
    const deviation = Math.abs(highestFramesPerSecond - prevEma) / prevEma;

    const isOutlier =
      highestFramesPerSecond < prevEma && deviation > DEVIATION_LIMIT;
    outlierStreakRef.current = isOutlier ? outlierStreakRef.current + 1 : 0;
    if (isOutlier && outlierStreakRef.current < OUTLIER_PERSISTENCE) return;

    emaRef.current = ALPHA * highestFramesPerSecond + (1 - ALPHA) * prevEma;

    setLowFps((prev) => {
      if (prev && emaRef.current > FPS_WARNING_THRESHOLD_UPPER) return false;
      if (!prev && emaRef.current < FPS_WARNING_THRESHOLD_LOWER) return true;

      return prev;
    });
  }, [highestFramesPerSecond, timestamp]);

  return lowFps;
}
