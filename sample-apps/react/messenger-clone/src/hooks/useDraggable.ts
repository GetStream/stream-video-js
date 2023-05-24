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
export const useDraggable = (element?: HTMLElement | null) => {
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!element) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!(event.button === 0 && event.buttons === 1)) return;
      const { left, top } = element.getBoundingClientRect();
      dragStart.current = { x: event.clientX - left, y: event.clientY - top };
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleDrag);
      dragStart.current = null;
    };
    const handleDrag = (event: MouseEvent) => {
      if (!dragStart.current) return;
      const deltaX = event.pageX - dragStart.current.x;
      const deltaY = event.pageY - dragStart.current.y;
      element.style.left = deltaX + 'px';
      element.style.top = deltaY + 'px';
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', throttle(handleDrag, 100));

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleDrag);
    };
  }, [element]);
};
