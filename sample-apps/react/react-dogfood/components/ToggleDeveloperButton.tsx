import { forwardRef } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
} from '@stream-io/video-react-sdk';

import { DevMenu } from './DevMenu';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButtonRender(props, ref) {
  const { t } = useAppI18n();
  return (
    <WithTooltip
      title={t('debug.devSettings.title', 'Dev Settings')}
      tooltipDisabled={props.menuShown}
    >
      <CompositeButton ref={ref} active={props.menuShown}>
        <Icon icon="developer" />
      </CompositeButton>
    </WithTooltip>
  );
});

export const ToggleDeveloperButton = () => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <DevMenu />
    </MenuToggle>
  );
};
