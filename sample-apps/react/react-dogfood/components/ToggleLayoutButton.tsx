import { forwardRef } from 'react';

import {
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';

import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>((props, ref) => {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <IconButton icon="grid" title="Layout" />
    </CompositeButton>
  );
});

export const ToggleLayoutButton = (props: LayoutSelectorProps) => {
  return (
    <MenuToggle
      placement="top-end"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <LayoutSelector
        visualType={LayoutSelectorType.LIST}
        selectedLayout={props.selectedLayout}
        onMenuItemClick={props.onMenuItemClick}
      />
    </MenuToggle>
  );
};
