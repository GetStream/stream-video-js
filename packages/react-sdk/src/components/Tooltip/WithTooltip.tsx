import { ComponentProps, useState } from 'react';
import { Tooltip, TooltipProps } from './Tooltip';
import { useEnterLeaveHandlers } from './hooks';

type WithPopupProps = ComponentProps<'div'> &
  Omit<TooltipProps<HTMLDivElement>, 'referenceElement' | 'children'> & {
    tooltipDisabled?: boolean;
  };

// todo: duplicate of CallParticipantList.tsx#MediaIndicator - refactor to a single component
export const WithTooltip = ({
  title,
  tooltipClassName,
  tooltipPlacement,
  tooltipDisabled,
  ...props
}: WithPopupProps) => {
  const { handleMouseEnter, handleMouseLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLDivElement | null>(
    null,
  );
  const tooltipActuallyVisible =
    !tooltipDisabled && Boolean(title) && tooltipVisible;

  return (
    <>
      <Tooltip
        referenceElement={tooltipAnchor}
        visible={tooltipActuallyVisible}
        tooltipClassName={tooltipClassName}
        tooltipPlacement={tooltipPlacement}
      >
        {title || ''}
      </Tooltip>
      <div
        ref={setTooltipAnchor}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </>
  );
};
