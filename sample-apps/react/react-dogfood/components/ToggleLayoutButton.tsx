import { forwardRef, useMemo } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useTooltipContext,
} from '@stream-io/video-react-sdk';

import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';
import { LayoutMap } from '../hooks';

export const ToggleLayoutButton = (props: LayoutSelectorProps) => {
  const { onMenuItemClick, selectedLayout } = props;
  const { hideTooltip } = useTooltipContext();
  const ToggleMenuButtonComponent = useMemo(
    () =>
      forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
        function ToggleMenuButton(buttonProps, ref) {
          return (
            <CompositeButton
              ref={ref}
              active={buttonProps.menuShown}
              variant="primary"
            >
              <Icon icon={LayoutMap[selectedLayout]?.icon || 'grid'} />
            </CompositeButton>
          );
        },
      ),
    [selectedLayout],
  );

  return (
    <MenuToggle
      placement="top-end"
      ToggleButton={ToggleMenuButtonComponent}
      visualType={MenuVisualType.MENU}
      onToggle={(menuShown) => menuShown && hideTooltip?.()}
    >
      <LayoutSelector
        visualType={LayoutSelectorType.LIST}
        selectedLayout={selectedLayout}
        onMenuItemClick={onMenuItemClick}
      />
    </MenuToggle>
  );
};
