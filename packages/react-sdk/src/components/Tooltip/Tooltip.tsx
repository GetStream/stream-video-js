import React, { useState } from 'react';
import { PopperProps, usePopper } from 'react-popper';
import clsx from 'clsx';

export type TooltipProps<T extends HTMLElement> = React.PropsWithChildren<{
  /** Reference element to which the tooltip should attach to */
  referenceElement: T | null;
  /** Additional class applied to the tooltip root element */
  className?: string;
  /** Popper's modifier (offset) property - [xAxis offset, yAxis offset], default [0, 10] */
  offset?: [number, number];
  /** Popper's placement property defining default position of the tooltip, default 'top' */
  placement?: PopperProps<unknown>['placement'];
  /** Tells component whether to render its contents */
  visible?: boolean;
}>;

export const Tooltip = <T extends HTMLElement>({
  children,
  className,
  offset = [0, 10],
  referenceElement,
  placement = 'top',
  visible = false,
}: TooltipProps<T>) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const { attributes, styles } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset,
        },
      },
    ],
    placement,
  });

  if (!visible) return null;

  return (
    <div
      className={clsx('str-video__tooltip', className)}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      {children}
    </div>
  );
};
