import React, { useCallback, useState } from 'react';

export const useEnterLeaveHandlers = <T extends HTMLElement>({
  onMouseEnter,
  onMouseLeave,
}: Partial<
  Record<'onMouseEnter' | 'onMouseLeave', React.MouseEventHandler<T>>
> = {}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleMouseEnter: React.MouseEventHandler<T> = useCallback(
    (e) => {
      setTooltipVisible(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter],
  );

  const handleMouseLeave: React.MouseEventHandler<T> = useCallback(
    (e) => {
      setTooltipVisible(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  return { handleMouseEnter, handleMouseLeave, tooltipVisible };
};
