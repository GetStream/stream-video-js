import { RefObject, useEffect, useRef } from 'react';

const throttle = <T>(fn: (arg: T) => void, delay: number) => {
  let time = Date.now();

  return (arg: T) => {
    if (time + delay - Date.now() <= 0) {
      fn(arg);
      time = Date.now();
    }
  };
};

export type OffsetOnAxisDef = {
  amount: number;
  /**
   * Can be any CSS compatible unit applied to CSS property `left` resp. `top`.
   */
  unit: string;
};

export type Position = {
  /**
   * Offset definition from the left side of the container.
   */
  left?: OffsetOnAxisDef;
  /**
   * Offset definition from the left side of the container
   */
  top?: OffsetOnAxisDef;
};

export type OnDragHandler = (
  /**
   * The mousemove event instance used to calculate the next position of the dragged element.
   */
  event: MouseEvent,
  /**
   * Next position applied to the dragged element.
   */
  nextPosition: Position,
) => void;

interface UseDraggableParams {
  /**
   * Element to be dragged
   */
  dragElementRef: RefObject<HTMLElement | null>;
  /**
   * Restricts the dragging in either x or y axis
   */
  axis?: 'x' | 'y';
  /**
   * Nearest parent with position: relative, relative to which the element will be positioned
   */
  containerElementRef?: RefObject<HTMLElement | null>;
  /**
   * Optional callback executed on mousedown
   */
  onMouseDown?: (event: MouseEvent) => void;
  /**
   * Optional callback executed on mousemove
   */
  onMouseMove?: OnDragHandler;
  /**
   * Optional callback executed on mouseup
   */
  onMouseUp?: (event: MouseEvent) => void;
  /**
   * Starting element position. Can be any CSS valid value assignable to left and top position.
   */
  startPosition?: Position;
  /**
   * Interval in which the element position is adjusted.
   */
  throttleInterval?: number;
}

export const useDraggable = ({
  axis,
  containerElementRef,
  dragElementRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  startPosition,
  throttleInterval = 0,
}: UseDraggableParams) => {
  const dragStart = useRef<{
    left: number;
    top: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const positionInitiated = useRef(false);

  useEffect(() => {
    const element = dragElementRef.current;
    if (!element || positionInitiated.current) return;

    const leftCSS = startPosition?.left
      ? startPosition.left.amount + startPosition.left.unit
      : undefined;
    const topCSS = startPosition?.top
      ? startPosition.top.amount + startPosition.top.unit
      : undefined;

    if (typeof leftCSS !== 'undefined' && leftCSS !== element.style.left) {
      element.style.left = leftCSS;
      positionInitiated.current = true;
    }
    if (typeof topCSS !== 'undefined' && topCSS !== element.style.top) {
      element.style.top = topCSS;
      positionInitiated.current = true;
    }
  }, [dragElementRef, startPosition]);

  useEffect(() => {
    const element = dragElementRef.current;
    const containerElement = containerElementRef?.current;
    if (!element) return;

    const handleDrag = (event: MouseEvent) => {
      if (!(dragStart.current && element)) return;
      const deltaX = event.clientX - dragStart.current.clientX;
      const deltaY = event.clientY - dragStart.current.clientY;
      const { width: elementWidth, height: elementHeight } =
        element.getBoundingClientRect();

      let newLeft = dragStart.current.left + deltaX;
      let newTop = dragStart.current.top + deltaY;

      if (containerElement) {
        const {
          left: containerLeft,
          top: containerTop,
          height: containerHeight,
          width: containerWidth,
        } = containerElement.getBoundingClientRect();

        const leftRelativeToContainer = event.clientX - containerLeft;
        newLeft =
          leftRelativeToContainer <= 0
            ? -(elementWidth / 2)
            : leftRelativeToContainer >= containerWidth
            ? containerWidth - elementWidth / 2
            : newLeft - containerLeft;

        const topRelativeToContainer = event.clientY - containerTop;
        newTop =
          topRelativeToContainer < 0
            ? -(elementHeight / 2)
            : topRelativeToContainer >= containerHeight
            ? containerHeight - elementHeight / 2
            : newTop - containerTop;
      }
      if (!axis || axis === 'x') {
        element.style.left = newLeft + 'px';
      }
      if (!axis || axis === 'y') {
        element.style.top = newTop + 'px';
      }
      onMouseMove?.(event, {
        left: { amount: newLeft, unit: 'px' },
        top: { amount: newTop, unit: 'px' },
      });
    };

    const handleDragStop = (event: MouseEvent) => {
      if (!dragStart.current) return;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragStop);
      dragStart.current = null;
      onMouseUp?.(event);
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!(event.button === 0 && event.buttons === 1 && element)) return;
      event.stopPropagation();
      const { left, top } = element.getBoundingClientRect();
      dragStart.current = {
        left,
        top,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      document.addEventListener(
        'mousemove',
        throttle(handleDrag, throttleInterval),
      );
      document.addEventListener('mouseup', handleDragStop);
      onMouseDown?.(event);
    };

    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragStop);
    };
  }, [
    axis,
    containerElementRef,
    dragElementRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    throttleInterval,
  ]);
};
