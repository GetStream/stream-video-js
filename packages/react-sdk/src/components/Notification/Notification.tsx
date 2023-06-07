import { PropsWithChildren, ReactNode, useEffect } from 'react';
import { Placement } from '@floating-ui/react';

import { useFloatingUIPreset } from '../../hooks';

export type NotificationProps = {
  message?: ReactNode;
  isVisible?: boolean;
  visibilityTimeout?: number;
  resetIsVisible?: () => void;
  placement?: Placement;
  iconClassName?: string | null;
};

export const Notification = (props: PropsWithChildren<NotificationProps>) => {
  const {
    isVisible,
    message,
    children,
    visibilityTimeout,
    resetIsVisible,
    placement = 'top',
    iconClassName = 'str-video__notification__icon',
  } = props;

  const { refs, x, y, strategy } = useFloatingUIPreset({
    placement,
    strategy: 'absolute',
  });

  useEffect(() => {
    if (!isVisible || !visibilityTimeout || !resetIsVisible) return;

    const timeout = setTimeout(() => {
      resetIsVisible();
    }, visibilityTimeout);

    return () => clearTimeout(timeout);
  }, [isVisible, resetIsVisible, visibilityTimeout]);

  return (
    <div ref={refs.setReference}>
      {isVisible && (
        <div
          className="str-video__notification"
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
        >
          {iconClassName && <i className={iconClassName} />}
          <span className="str-video__notification__message">{message}</span>
        </div>
      )}
      {children}
    </div>
  );
};
