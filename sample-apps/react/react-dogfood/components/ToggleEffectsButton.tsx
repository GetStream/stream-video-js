import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
  useBackgroundFilters,
  useI18n,
} from '@stream-io/video-react-sdk';
import { forwardRef } from 'react';
import { useLayoutSwitcher } from '../hooks';
import { SettingsTabModalMenu } from './Settings/SettingsTabModal';

const ToggleEffectsMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleEffectsMenuButton(props, ref) {
  const { isSupported: effectsSupported } = useBackgroundFilters();
  const { t } = useI18n();
  return (
    <WithTooltip
      title={t(
        effectsSupported
          ? 'Video effects'
          : 'Video effects are not supported on this device',
      )}
    >
      <CompositeButton
        ref={ref}
        disabled={!effectsSupported}
        active={props.menuShown}
        variant="primary"
      >
        <Icon icon="video-effects" />
      </CompositeButton>
    </WithTooltip>
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
