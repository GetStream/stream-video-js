import { MouseEventHandler, useCallback, useState } from 'react';

export const useEnterLeaveHandlers = <T extends HTMLElement>({
  onMouseEnter,
  onMouseLeave,
}: Partial<
  Record<'onMouseEnter' | 'onMouseLeave', MouseEventHandler<T>>
> = {}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleMouseEnter: MouseEventHandler<T> = useCallback(
    (e) => {
      setTooltipVisible(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter],
  );

  const handleMouseLeave: MouseEventHandler<T> = useCallback(
    (e) => {
      setTooltipVisible(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  const forceShow = useCallback(() => setTooltipVisible(true), []);
  const forceHide = useCallback(() => setTooltipVisible(false), []);

  return {
    handleMouseEnter,
    handleMouseLeave,
    tooltipVisible,
    forceShow,
    forceHide,
  };
};
