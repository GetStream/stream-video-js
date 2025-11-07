import { PropsWithChildren } from 'react';
import { Placement } from '@floating-ui/react';

import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { Notification } from './Notification';
import { useBackgroundFilters } from '../BackgroundFilters';
import { useLowFpsWarning } from '../../hooks/useLowFpsWarning';

export type DegradedPerformanceNotificationProps = {
  /**
   * Text message displayed by the notification.
   */
  text?: string;
  placement?: Placement;
  className?: string;
};

export const DegradedPerformanceNotification = ({
  children,
  text,
  placement,
  className,
}: PropsWithChildren<DegradedPerformanceNotificationProps>) => {
  const { useCallStatsReport } = useCallStateHooks();
  const callStatsReport = useCallStatsReport();
  const { backgroundFilter } = useBackgroundFilters();

  const showLowFpsWarning = useLowFpsWarning(callStatsReport?.publisherStats);

  const { t } = useI18n();

  const message =
    text ??
    t(
      'Background filters performance is degraded. Consider disabling filters for better performance.',
    );
  return (
    <Notification
      isVisible={showLowFpsWarning && !!backgroundFilter}
      placement={placement || 'top-start'}
      message={message}
      className={className}
    >
      {children}
    </Notification>
  );
};
