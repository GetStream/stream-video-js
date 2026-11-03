import { PropsWithChildren, useCallback, useState } from 'react';
import { Notification, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

/**
 * Camera frame rates below this value make the published video look choppy.
 */
const LOW_FRAME_RATE_THRESHOLD = 15;

/**
 * How many consecutive stats reports (one every ~2s) must be below the
 * threshold before the warning shows. Absorbs camera warm-up and device switches.
 */
const LOW_FRAME_RATE_REPORTS = 5;

export type LowCameraFrameRateNotificationProps = {
  text?: string;
  className?: string;
};

/**
 * Warns the user when their camera hands the browser too few frames per second.
 * The network and the encoder can't make up for a slow camera, so the
 * user is the only one who can fix it (switch cameras, close other apps, restart).
 */
export const LowCameraFrameRateNotification = ({
  children,
  text,
  className,
}: PropsWithChildren<LowCameraFrameRateNotificationProps>) => {
  const { t } = useAppI18n();
  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();
  const [lastReport, setLastReport] = useState(callStatsReport);
  const [lowReports, setLowReports] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // count once per new stats report, not on every render
  if (callStatsReport !== lastReport) {
    setLastReport(callStatsReport);
    const frameRate = callStatsReport?.publisherStats.cameraCapture?.frameRate;
    const isLow = frameRate != null && frameRate < LOW_FRAME_RATE_THRESHOLD;
    setLowReports(isLow ? lowReports + 1 : 0);
    if (!isLow) setIsDismissed(false);
  }

  const close = useCallback(() => setIsDismissed(true), []);

  const message =
    text ??
    t(
      'notification.lowCameraFrameRate.text',
      'Your camera is sending very few frames, so your video may look choppy to others. Try another camera, close other apps using it, or restart your browser.',
    );

  return (
    <Notification
      isVisible={lowReports >= LOW_FRAME_RATE_REPORTS && !isDismissed}
      placement="top-start"
      message={message}
      className={className}
      close={close}
    >
      {children}
    </Notification>
  );
};
