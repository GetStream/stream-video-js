import { forwardRef } from 'react';

import { CallStats } from '../StreamCall/CallStats';
import { CompositeButton, IconButton } from '../Button/';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';

type CallStatsButtonProps = {
  caption?: string;
};

export const CallStatsButton = ({
  caption = 'Stats',
}: CallStatsButtonProps) => {
  return (
    <MenuToggle placement="top-end" ToggleButton={ToggleMenuButton}>
      <CallStats />
    </MenuToggle>
  );
};

const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps<HTMLDivElement>
>(({ menuShown }, ref) => (
  <CompositeButton ref={ref} active={menuShown} caption={'Stats'}>
    <IconButton icon="stats" title="Statistics" />
  </CompositeButton>
));
