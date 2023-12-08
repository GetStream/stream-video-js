import { forwardRef } from 'react';

import {
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';

import { DevMenu } from './DevMenu';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>((props, ref) => {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <IconButton icon="developer" />
    </CompositeButton>
  );
});

export const ToggleDeveloperButton = () => {
  return (
    <MenuToggle
      placement="top-end"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <DevMenu />
    </MenuToggle>
  );
};
