import { forwardRef, useMemo } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
} from '@stream-io/video-react-sdk';

import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';
import { LayoutMap } from '../hooks';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleLayoutButton = (props: LayoutSelectorProps) => {
  const { onMenuItemClick, selectedLayout } = props;
  const ToggleMenuButtonComponent = useMemo(
    () =>
      forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
        function ToggleMenuButton(buttonProps, ref) {
          const { t } = useAppI18n();
          return (
            <WithTooltip
              title={t('settings.layout.label', 'Layout')}
              tooltipDisabled={buttonProps.menuShown}
            >
              <CompositeButton ref={ref} active={buttonProps.menuShown}>
                <Icon icon={LayoutMap[selectedLayout]?.icon || 'grid'} />
              </CompositeButton>
            </WithTooltip>
          );
        },
      ),
    [selectedLayout],
  );

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButtonComponent}
      visualType={MenuVisualType.MENU}
    >
      <LayoutSelector
        visualType={LayoutSelectorType.LIST}
        selectedLayout={selectedLayout}
        onMenuItemClick={onMenuItemClick}
      />
    </MenuToggle>
  );
};
