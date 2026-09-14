import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
  useBackgroundFilters,
} from '@stream-io/video-react-sdk';
import { forwardRef } from 'react';
import { useLayoutSwitcher } from '../hooks';
import { SettingsTabModalMenu } from './Settings/SettingsTabModal';
import { useAppI18n } from '../hooks/useAppI18n';

const ToggleEffectsMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleEffectsMenuButtonRender(props, ref) {
  const { isSupported: effectsSupported } = useBackgroundFilters();
  const { t } = useAppI18n();
  return (
    <WithTooltip
      title={
        effectsSupported
          ? t('videoEffects.toggle.title', 'Video effects')
          : t(
              'videoEffects.toggle.unsupported.title',
              'Video effects are not supported on this device',
            )
      }
    >
      <CompositeButton
        ref={ref}
        disabled={!effectsSupported}
        active={props.menuShown}
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
