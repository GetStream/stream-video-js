import clsx from 'clsx';
import { SfuModels } from '@stream-io/video-client';

export type ConnectionQualityIndicatorProps = {
  quality: SfuModels.ConnectionQuality;
  title?: string;
  className?: string;
};

/** How many of the three bars are lit, per quality level. */
const ACTIVE_BARS: Partial<Record<SfuModels.ConnectionQuality, number>> = {
  [SfuModels.ConnectionQuality.POOR]: 1,
  [SfuModels.ConnectionQuality.GOOD]: 2,
  [SfuModels.ConnectionQuality.EXCELLENT]: 3,
};

const BAR_COUNT = 3;

/**
 * Three ascending bars showing a participant's connection quality.
 */
export const ConnectionQualityIndicator = ({
  quality,
  title,
  className,
}: ConnectionQualityIndicatorProps) => {
  const activeBars = ACTIVE_BARS[quality];

  if (!activeBars) return null;

  const level = SfuModels.ConnectionQuality[quality].toLowerCase();

  return (
    <span
      className={clsx(
        'str-video__connection-quality-indicator',
        `str-video__connection-quality-indicator--${level}`,
        className,
      )}
      title={title ?? level}
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span
          key={index}
          className={clsx(
            'str-video__connection-quality-indicator__bar',
            index < activeBars &&
              'str-video__connection-quality-indicator__bar--active',
          )}
        />
      ))}
    </span>
  );
};
