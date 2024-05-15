import {
  ComponentProps,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Tooltip, TooltipProps } from './Tooltip';
import { useEnterLeaveHandlers } from './hooks';

type WithPopupProps = Omit<ComponentProps<'div'>, 'children'> &
  Omit<TooltipProps<HTMLDivElement>, 'referenceElement' | 'children'> & {
    children?: ReactNode | ((context: TooltipContextValue) => ReactNode);
  };

interface TooltipContextValue {
  hideTooltip: () => void;
}

export const TooltipContext = createContext<TooltipContextValue>({
  hideTooltip: () => {},
});

// todo: duplicate of CallParticipantList.tsx#MediaIndicator - refactor to a single component
export const WithTooltip = ({
  title,
  tooltipClassName,
  tooltipPlacement,
  children,
  ...props
}: WithPopupProps) => {
  const { handleMouseEnter, handleMouseLeave, tooltipVisible, forceHide } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLDivElement | null>(
    null,
  );
  const contextValue = useMemo<TooltipContextValue>(
    () => ({ hideTooltip: forceHide }),
    [forceHide],
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      <Tooltip
        referenceElement={tooltipAnchor}
        visible={Boolean(title) && tooltipVisible}
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
      >
        {typeof children === 'function' ? children(contextValue) : children}
      </div>
    </TooltipContext.Provider>
  );
};

export function useTooltipContext() {
  return useContext(TooltipContext);
}
