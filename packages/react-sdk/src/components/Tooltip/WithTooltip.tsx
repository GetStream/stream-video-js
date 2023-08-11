import { ComponentProps, useState } from 'react';
import { Tooltip, TooltipProps } from './Tooltip';
import { useEnterLeaveHandlers } from './hooks';

type WithPopupProps = ComponentProps<'div'> &
  Omit<TooltipProps<HTMLDivElement>, 'referenceElement'>;

// todo: duplicate of CallParticipantList.tsx#MediaIndicator - refactor to a single component
export const WithTooltip = ({
  title,
  tooltipClassName,
  tooltipPlacement,
  ...props
}: WithPopupProps) => {
  const { handleMouseEnter, handleMouseLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <>
      <Tooltip
        referenceElement={tooltipAnchor}
        visible={tooltipVisible}
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
