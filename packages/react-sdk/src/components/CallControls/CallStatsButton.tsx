import { forwardRef } from 'react';

import { CallStats } from '../CallStats';
import { CompositeButton, IconButton } from '../Button/';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';

export const CallStatsButton = () => (
  <MenuToggle placement="top-end" ToggleButton={ToggleMenuButton}>
    <CallStats />
  </MenuToggle>
);

const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps<HTMLDivElement>
>(({ menuShown }, ref) => (
  <CompositeButton ref={ref} active={menuShown} caption={'Stats'}>
    <IconButton icon="stats" title="Statistics" />
  </CompositeButton>
));
