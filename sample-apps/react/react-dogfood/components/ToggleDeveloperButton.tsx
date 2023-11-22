import { forwardRef } from 'react';

import {
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
} from '@stream-io/video-react-sdk';

import { DevMenu } from './DevMenu';

export const ToggleMenuButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <CompositeButton>
      <IconButton ref={ref} icon="developer" />
    </CompositeButton>
  );
});

export const ToggleDeveloperButton = () => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.PORTAL}
    >
      <DevMenu />
    </MenuToggle>
  );
};
