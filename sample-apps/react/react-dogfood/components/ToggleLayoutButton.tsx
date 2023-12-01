import { forwardRef } from 'react';

import {
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
} from '@stream-io/video-react-sdk';

import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';

export const ToggleMenuButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <CompositeButton>
      <IconButton ref={ref} icon="grid" title="Layout" />
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
