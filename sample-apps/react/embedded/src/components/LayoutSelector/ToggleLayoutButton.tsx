import { forwardRef, useMemo } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
} from '@stream-io/video-react-sdk';

import { Layouts } from '../../layouts/LayoutMap';
import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';

export const ToggleLayoutButton = (props: LayoutSelectorProps) => {
  const { onMenuItemClick, selectedLayout } = props;

  const ToggleMenuButtonComponent = useMemo(
    () =>
      forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
        function ToggleMenuButton(buttonProps, ref) {
          return (
            <WithTooltip title="Layout" tooltipDisabled={buttonProps.menuShown}>
              <CompositeButton
                ref={ref}
                active={buttonProps.menuShown}
                variant="primary"
              >
                <Icon icon={Layouts[selectedLayout]?.icon || 'grid'} />
              </CompositeButton>
            </WithTooltip>
          );
        },
      ),
    [selectedLayout],
  );

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButtonComponent}
      visualType={MenuVisualType.MENU}
    >
      <LayoutSelector
        visualType={LayoutSelectorType.LIST}
        selectedLayout={selectedLayout}
        onMenuItemClick={onMenuItemClick}
      />
    </MenuToggle>
  );
};
