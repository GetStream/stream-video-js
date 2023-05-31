import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 10;

/**
 * Hook which observes element's scroll position and returns text value based on the
 * position of the scrollbar (`top`, `bottom`, `between` and `null` if no scrollbar is available)
 */
export const useVerticalScrollPosition = (
  scrollElement: HTMLElement | null,
  threshold: number = SCROLL_THRESHOLD,
) => {
  const [scrollPosition, setScrollPosition] = useState<
    'top' | 'bottom' | 'between' | null
  >(null);

  useEffect(() => {
    if (!scrollElement) return;

    const scrollHandler = () => {
      const element = scrollElement;

      const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;

      if (!hasVerticalScrollbar) return setScrollPosition(null);

      const isAtTheTop = element.scrollTop <= threshold;
      if (isAtTheTop) return setScrollPosition('top');

      const isAtTheBottom =
        Math.abs(
          element.scrollHeight - element.scrollTop - element.clientHeight,
        ) <= threshold;

      if (isAtTheBottom) return setScrollPosition('bottom');

      setScrollPosition('between');
    };

    const resizeObserver = new ResizeObserver(scrollHandler);
    resizeObserver.observe(scrollElement);

    scrollElement.addEventListener('scroll', scrollHandler);
    return () => {
      scrollElement.removeEventListener('scroll', scrollHandler);
      resizeObserver.disconnect();
    };
  }, [scrollElement, threshold]);

  return scrollPosition;
};

export const useHorizontalScrollPosition = (
  scrollElement: HTMLElement | null,
  threshold: number = SCROLL_THRESHOLD,
) => {
  const [scrollPosition, setScrollPosition] = useState<
    'start' | 'end' | 'between' | null
  >(null);

  useEffect(() => {
    if (!scrollElement) return;

    const scrollHandler = () => {
      const element = scrollElement;

      const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

      if (!hasHorizontalScrollbar) return setScrollPosition(null);

      const isAtTheStart = element.scrollLeft <= threshold;
      if (isAtTheStart) return setScrollPosition('start');

      const isAtTheEnd =
        Math.abs(
          element.scrollWidth - element.scrollLeft - element.clientWidth,
        ) <= threshold;

      if (isAtTheEnd) return setScrollPosition('end');

      setScrollPosition('between');
    };

    const resizeObserver = new ResizeObserver(scrollHandler);
    resizeObserver.observe(scrollElement);

    scrollElement.addEventListener('scroll', scrollHandler);
    return () => {
      scrollElement.removeEventListener('scroll', scrollHandler);
      resizeObserver.disconnect();
    };
  }, [scrollElement, threshold]);

  return scrollPosition;
};
