import { PropsWithChildren, useEffect } from 'react';
import clsx from 'clsx';
import { useFloatingUIPreset } from '../../hooks';
import { Placement } from '@floating-ui/react';

export type TooltipProps<T extends HTMLElement> = PropsWithChildren<{
  /** Reference element to which the tooltip should attach to */
  referenceElement: T | null;
  /** Additional class applied to the tooltip root element */
  tooltipClassName?: string;
  /** Popper's modifier (offset) property - [xAxis offset, yAxis offset], default [0, 10] */
  offset?: [number, number];
  /** Popper's placement property defining default position of the tooltip, default 'top' */
  tooltipPlacement?: Placement;
  /** Tells component whether to render its contents */
  visible?: boolean;
}>;

export const Tooltip = <T extends HTMLElement>({
  children,
  referenceElement,
  tooltipClassName,
  tooltipPlacement = 'top',
  visible = false,
}: TooltipProps<T>) => {
  const { refs, x, y, strategy } = useFloatingUIPreset({
    placement: tooltipPlacement,
    strategy: 'absolute',
  });

  useEffect(() => {
    refs.setReference(referenceElement);
  }, [referenceElement, refs]);

  if (!visible) return null;

  return (
    <div
      className={clsx('str-video__tooltip', tooltipClassName)}
      ref={refs.setFloating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
};
