import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';
import { forwardRef } from 'react';
import { useLayoutSwitcher } from '../hooks';
import { SettingsTabModalMenu } from './Settings/SettingsTabModal';

const ToggleEffectsMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleEffectsMenuButton(props, ref) {
  return (
    <CompositeButton
      ref={ref}
      active={props.menuShown}
      title="Video effects"
      variant="primary"
    >
      <Icon icon="video-effects" />
    </CompositeButton>
  );
});

export const ToggleEffectsButton = () => {
  const { layout, setLayout } = useLayoutSwitcher();
  return (
    <MenuToggle
      ToggleButton={ToggleEffectsMenuButton}
      placement="top-start"
      visualType={MenuVisualType.PORTAL}
    >
      <SettingsTabModalMenu
        tabModalProps={{
          inMeeting: true,
          activeTab: 1,
        }}
        layoutProps={{
          selectedLayout: layout,
          onMenuItemClick: setLayout,
        }}
      />
    </MenuToggle>
  );
};
