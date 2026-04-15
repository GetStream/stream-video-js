import { PropsWithChildren, useMemo } from 'react';
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

  const message = useMemo(() => {
    if (text) {
      return text;
    }

    const reasons = performance?.reason || [];
    const hasFrameDrop = reasons.includes('frame-drop');
    const hasCpuThrottling = reasons.includes('cpu-throttling');

    if (hasFrameDrop && hasCpuThrottling) {
      return t(
        'Background filters are reducing frame rate and overloading the CPU. Disable filters for optimal performance.',
      );
    }

    if (hasFrameDrop) {
      return t(
        'Background filters are reducing frame rate. Consider disabling filters for optimal performance.',
      );
    }

    return t(
      'Background filters performance is degraded. Consider disabling filters for optimal performance.',
    );
  }, [text, performance?.reason, t]);

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
