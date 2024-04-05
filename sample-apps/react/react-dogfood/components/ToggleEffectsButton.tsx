import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useBackgroundFilters,
} from '@stream-io/video-react-sdk';
import { forwardRef } from 'react';
import { useLayoutSwitcher } from '../hooks';
import { SettingsTabModalMenu } from './Settings/SettingsTabModal';

const ToggleEffectsMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleEffectsMenuButton(props, ref) {
  const { isSupported: effectsSupported } = useBackgroundFilters();
  return (
    <CompositeButton
      ref={ref}
      disabled={!effectsSupported}
      active={props.menuShown}
      title={
        effectsSupported
          ? 'Video effects'
          : 'Video effects are not supported on this device'
      }
      variant="primary"
    >
      <Icon icon="video-effects" />
    </CompositeButton>
  );
});

export const ToggleEffectsButton = (props: { inMeeting?: boolean }) => {
  const { inMeeting = true } = props;
  const { layout, setLayout } = useLayoutSwitcher();
  return (
    <MenuToggle
      ToggleButton={ToggleEffectsMenuButton}
      placement="top-start"
      visualType={MenuVisualType.PORTAL}
    >
      <SettingsTabModalMenu
        tabModalProps={{
          inMeeting,
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
