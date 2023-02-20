import { Placement } from '@popperjs/core';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';

export type NotificationProps = {
  message?: ReactNode;
  isVisible?: boolean;
  visibilityTimeout?: number;
  resetIsVisible?: () => void;
  placement?: Placement;
};

export const Notification = (props: PropsWithChildren<NotificationProps>) => {
  const {
    isVisible,
    message,
    children,
    visibilityTimeout,
    resetIsVisible,
    placement = 'top',
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
    <>
      <span ref={setAnchor} data-popper-anchor="">
        {children}
      </span>
      {isVisible && (
        <div
          className="str-video__notification"
          ref={setPopover}
          style={styles.popper}
          {...attributes.popper}
        >
          <i className="str-video__notification__icon" />
          <span className="str-video__notification__message">{message}</span>
        </div>
      )}
    </>
  );
};
