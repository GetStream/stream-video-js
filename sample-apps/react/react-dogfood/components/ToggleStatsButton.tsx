import {
  CallStats,
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';
import { forwardRef } from 'react';

const ToggleMenuButton = forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return (
      <CompositeButton ref={ref} active={props.menuShown} variant="primary">
        <IconButton icon="stats" title="Stats" />
      </CompositeButton>
    );
  },
);

export const ToggleStatsButton = () => {
  return (
    <MenuToggle
      placement="top-end"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <div className="rd__stats-wrapper">
        <CallStats />
      </div>
    </MenuToggle>
  );
};
