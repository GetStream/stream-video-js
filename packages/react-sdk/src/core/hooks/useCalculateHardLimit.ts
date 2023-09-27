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
    vertical: number | null;
    horizontal: number | null;
  }>({
    vertical: typeof limit === 'number' ? limit : null,
    horizontal: typeof limit === 'number' ? limit : null,
  });

  useEffect(() => {
    if (
      !hostElement ||
      !wrapperElement ||
      typeof limit === 'number' ||
      typeof limit === 'undefined'
    )
      return;

    let childWidth: number | null = null;
    let childHeight: number | null = null;

    const resizeObserver = new ResizeObserver((entries, observer) => {
      // this part should ideally run as little times as possible
      // get child measurements and disconnect
      // does not consider dynamically sized children
      // this hook is for SpeakerLayout use only, where children in the bar are fixed size
      if (entries.length > 1) {
        const child = hostElement.firstChild as HTMLElement | null;

        if (child) {
          childHeight = child.clientHeight;
          childWidth = child.clientWidth;
          observer.unobserve(hostElement);
        }
      }

      // keep the state at { vertical: 1, horizontal: 1 }
      // until we get the proper child measurements
      if (childHeight === null || childWidth === null) return;

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
