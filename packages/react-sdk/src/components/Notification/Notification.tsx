import { Placement } from '@popperjs/core';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';

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
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(anchor, popover, {
    placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 15],
        },
      },
    ],
  });

  useEffect(() => {
    if (!isVisible || !visibilityTimeout || !resetIsVisible) return;

    const timeout = setTimeout(() => {
      resetIsVisible();
    }, visibilityTimeout);

    return () => clearTimeout(timeout);
  }, [isVisible, resetIsVisible, visibilityTimeout]);

  return (
    <div ref={setAnchor} data-popper-anchor="">
      {isVisible && (
        <div
          className="str-video__notification"
          ref={setPopover}
          style={styles.popper}
          {...attributes.popper}
        >
          {iconClassName && <i className={iconClassName} />}
          <span className="str-video__notification__message">{message}</span>
        </div>
      )}
      {children}
    </div>
  );
};
