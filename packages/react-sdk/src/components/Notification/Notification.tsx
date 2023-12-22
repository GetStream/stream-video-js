import { PropsWithChildren, ReactNode, useEffect } from 'react';
import { Placement } from '@floating-ui/react';

import { Icon } from '../Icon';

import { useFloatingUIPreset } from '../../hooks';

export type NotificationProps = {
  message?: ReactNode;
  isVisible?: boolean;
  visibilityTimeout?: number;
  resetIsVisible?: () => void;
  placement?: Placement;
  iconClassName?: string | null;
  close?: () => void;
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
    close,
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
          {close ? (
            <i
              className="str-video__icon str-video__icon--close str-video__notification__close"
              onClick={close}
            />
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
};
