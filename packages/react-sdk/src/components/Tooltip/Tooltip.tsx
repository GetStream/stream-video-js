import { PropsWithChildren, useState } from 'react';
import { PopperProps, usePopper } from 'react-popper';
import clsx from 'clsx';

export type TooltipProps<T extends HTMLElement> = PropsWithChildren<{
  /** Reference element to which the tooltip should attach to */
  referenceElement: T | null;
  /** Additional class applied to the tooltip root element */
  tooltipClassName?: string;
  /** Popper's modifier (offset) property - [xAxis offset, yAxis offset], default [0, 10] */
  offset?: [number, number];
  /** Popper's placement property defining default position of the tooltip, default 'top' */
  tooltipPlacement?: PopperProps<unknown>['placement'];
  /** Tells component whether to render its contents */
  visible?: boolean;
}>;

export const Tooltip = <T extends HTMLElement>({
  children,
  offset = [0, 10],
  referenceElement,
  tooltipClassName,
  tooltipPlacement = 'top',
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
    placement: tooltipPlacement,
  });

  if (!visible) return null;

  return (
    <div
      className={clsx('str-video__tooltip', tooltipClassName)}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      {children}
    </div>
  );
};
