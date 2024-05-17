import { forwardRef } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
  useI18n,
} from '@stream-io/video-react-sdk';

import { DevMenu } from './DevMenu';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButton(props, ref) {
  const { t } = useI18n();
  return (
    <WithTooltip title={t('Dev Settings')} tooltipDisabled={props.menuShown}>
      <CompositeButton ref={ref} active={props.menuShown} variant="primary">
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
