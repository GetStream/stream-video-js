import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Notification, useCall } from '@stream-io/video-react-sdk';
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
  const call = useCall();
  const { t } = useAppI18n();
  const [isLow, setIsLow] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!call) return;

    let lowReports = 0;
    const subscription = call.state.callStatsReport$.subscribe((report) => {
      const { status, mediaStream, rootMediaStream } = call.camera.state;
      const frameRate = report?.publisherStats.camera?.frameRate;
      // with video filters, the stats describe the filtered track, and
      // DegradedPerformanceNotification already covers filter-induced drops
      const hasFilters = mediaStream !== rootMediaStream;
      if (status !== 'enabled' || hasFilters || frameRate == null) {
        lowReports = 0;
      } else if (frameRate < LOW_FRAME_RATE_THRESHOLD) {
        lowReports++;
      } else {
        lowReports = 0;
      }

      const low = lowReports >= LOW_FRAME_RATE_REPORTS;
      setIsLow(low);
      if (!low) setIsDismissed(false);
    });

    return () => subscription.unsubscribe();
  }, [call]);

  const close = useCallback(() => setIsDismissed(true), []);

  const message =
    text ??
    t(
      'notification.lowCameraFrameRate.text',
      'Your camera is sending very few frames, so your video may look choppy to others. Try another camera, close other apps using it, or restart your browser.',
    );

  return (
    <Notification
      state="error"
      isVisible={isLow && !isDismissed}
      placement="top-start"
      message={message}
      className={className}
      close={close}
    >
      {children}
    </Notification>
  );
};
