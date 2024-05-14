import { forwardRef } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useTooltipContext,
} from '@stream-io/video-react-sdk';

import { DevMenu } from './DevMenu';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButton(props, ref) {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <Icon icon="developer" />
    </CompositeButton>
  );
});

export const ToggleDeveloperButton = () => {
  const { hideTooltip } = useTooltipContext();
  return (
    <MenuToggle
      placement="top-end"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
      onToggle={(menuShown) => menuShown && hideTooltip?.()}
    >
      <DevMenu />
    </MenuToggle>
  );
};
