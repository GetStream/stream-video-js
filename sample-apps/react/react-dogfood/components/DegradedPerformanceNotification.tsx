import { PropsWithChildren } from 'react';
import { Placement } from '@floating-ui/react';
import {
  Notification,
  useBackgroundFilters,
  useI18n,
} from '@stream-io/video-react-sdk';

export type DegradedPerformanceNotificationProps = {
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
  const { performance } = useBackgroundFilters();

  const { t } = useI18n();

  const message =
    text ??
    t(
      'Background filters performance is degraded. Consider disabling filters for optimal performance.',
    );

  return (
    <Notification
      isVisible={performance?.degraded}
      placement={placement || 'top-start'}
      message={message}
      className={className}
    >
      {children}
    </Notification>
  );
};
