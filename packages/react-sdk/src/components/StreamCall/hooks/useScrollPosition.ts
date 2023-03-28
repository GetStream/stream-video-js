import { useEffect, useState } from 'react';

const SCROLL_TRESHOLD = 10;

/**
 * Hook which observes element's scroll position and returns text value based on the
 * position of the scrollbar (`top`, `bottom`, `between` and `null` if no scrollbar is available)
 */
export const useVerticalScrollPosition = (
  scrollElement: HTMLElement | null,
  treshold: number = SCROLL_TRESHOLD,
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

      const isAtTheTop = element.scrollTop <= treshold;
      if (isAtTheTop) return setScrollPosition('top');

      const isAtTheBottom =
        Math.abs(
          element.scrollHeight - element.scrollTop - element.clientHeight,
        ) <= treshold;

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
  }, [scrollElement, treshold]);

  return scrollPosition;
};
