import { useEffect, useState } from 'react';

export const useCalculateHardLimit = (
  /**
   * Element that stretches to 100% of the whole layout component
   */
  wrapperElement: HTMLDivElement | null,
  /**
   * Element that directly hosts individual `ParticipantView` (or wrapper) elements
   */
  hostElement: HTMLDivElement | null,
  limit?: 'dynamic' | number,
) => {
  const [calculatedLimit, setCalculatedLimit] = useState<{
    vertical: number;
    horizontal: number;
  }>({
    vertical: typeof limit === 'number' ? limit : 1,
    horizontal: typeof limit === 'number' ? limit : 1,
  });

  useEffect(() => {
    if (
      !hostElement ||
      !wrapperElement ||
      typeof limit === 'number' ||
      typeof limit === 'undefined'
    )
      return;

    let childWidth = 280;
    let childHeight = 160;

    const resizeObserver = new ResizeObserver((entries, observer) => {
      if (entries.length > 1) {
        const child = hostElement.firstChild as HTMLElement | null;

        if (child) {
          childHeight = child.clientHeight;
          childWidth = child.clientWidth;
          observer.unobserve(hostElement);
        }
      }

      const vertical = Math.floor(wrapperElement.clientHeight / childHeight);
      const horizontal = Math.floor(wrapperElement.clientWidth / childWidth);

      setCalculatedLimit((pv) => {
        if (pv.vertical !== vertical || pv.horizontal !== horizontal)
          return { vertical, horizontal };
        return pv;
      });
    });

    resizeObserver.observe(wrapperElement);
    resizeObserver.observe(hostElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [hostElement, limit, wrapperElement]);

  return calculatedLimit;
};
