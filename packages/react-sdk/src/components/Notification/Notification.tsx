import { PropsWithChildren, ReactNode, useEffect } from 'react';
import clsx from 'clsx';
import { Placement } from '@floating-ui/react';
import { useFloatingUIPreset } from '../../hooks';

export type NotificationState = 'success' | 'error' | 'loading';

const ICON_BY_STATE: Record<NotificationState, string> = {
  success: 'checkmark',
  error: 'exclamation-circle-fill',
  loading: 'loading',
};

export type NotificationProps = {
  message?: ReactNode;
  isVisible?: boolean;
  visibilityTimeout?: number;
  resetIsVisible?: () => void;
  placement?: Placement;
  className?: string;
  state?: NotificationState;
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
    className,
    state,
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

  const icon =
    state && `str-video__icon str-video__icon--${ICON_BY_STATE[state]}`;

  return (
    <div className="str-video__notification-wrapper" ref={refs.setReference}>
      {isVisible && (
        <div
          className={clsx(
            'str-video__notification',
            state && `str-video__notification--${state}`,
            close && 'str-video__notification--dismissible',
            className,
          )}
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
        >
          {icon && <i className={icon} />}
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
