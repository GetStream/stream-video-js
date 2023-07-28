import { useEffect, useRef } from 'react';

const throttle = <T>(fn: (arg: T) => void, delay: number) => {
  let time = Date.now();

  return (arg: T) => {
    if (time + delay - Date.now() <= 0) {
      fn(arg);
      time = Date.now();
    }
  };
};

interface UseDraggableParams {
  /**
   * Element to be dragged
   */
  element: HTMLElement | null;
  /**
   * Nearest parent with position: relative, relative to which the element will be positioned
   */
  containerElement?: HTMLElement | null;
  /**
   * Optional callback executed on mousedown
   */
  onMouseDown?: (event: MouseEvent) => void;
  /**
   * Optional callback executed on mousemove
   */
  onMouseMove?: (event: MouseEvent) => void;
  /**
   * Optional callback executed on mouseup
   */
  onMouseUp?: (event: MouseEvent) => void;
  /**
   * Restricts the dragging in either x or y axis
   */
  axis?: 'x' | 'y';
  /**
   * Interval in which the element position is adjusted
   */
  throttleInterval?: number;
}

export const useDraggable = ({
  containerElement,
  element,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  axis,
  throttleInterval = 0,
}: UseDraggableParams) => {
  const dragStart = useRef<{
    left: number;
    top: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  useEffect(() => {
    if (!element) return;

    const handleDrag = (event: MouseEvent) => {
      if (!(dragStart.current && element)) return;
      const deltaX = event.clientX - dragStart.current.clientX;
      const deltaY = event.clientY - dragStart.current.clientY;

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
          leftRelativeToContainer < 0
            ? 0
            : leftRelativeToContainer > containerWidth
            ? containerWidth
            : newLeft - containerLeft;
        const topRelativeToContainer = event.clientY - containerTop;

        newTop =
          topRelativeToContainer < 0
            ? 0
            : topRelativeToContainer > containerHeight
            ? containerHeight
            : newTop - containerTop;
      }
      if (!axis || axis === 'x') {
        element.style.left = newLeft + 'px';
      }
      if (!axis || axis === 'y') {
        element.style.top = newTop + 'px';
      }
      onMouseMove?.(event);
    };

    const handleDragStop = (event: MouseEvent) => {
      if (!dragStart.current) return;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mousemove', handleDrag);
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
    containerElement,
    element,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    throttleInterval,
  ]);
};
