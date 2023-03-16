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

    const hasVerticalScrollbar =
      scrollElement.scrollHeight > scrollElement.clientHeight;

    setScrollPosition(hasVerticalScrollbar ? 'top' : null);

    const scrollHandler = (e: Event) => {
      const element = e.currentTarget as Element;

      const isAtTheTop = element.scrollTop <= treshold;
      const isAtTheBottom =
        Math.abs(
          element.scrollHeight - element.scrollTop - element.clientHeight,
        ) <= treshold;

      if (isAtTheTop) return setScrollPosition('top');
      if (isAtTheBottom) return setScrollPosition('bottom');

      setScrollPosition('between');
    };

    scrollElement.addEventListener('scroll', scrollHandler);
    return () => scrollElement.removeEventListener('scroll', scrollHandler);
  }, [scrollElement, treshold]);

  return scrollPosition;
};
