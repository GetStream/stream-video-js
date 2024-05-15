import { forwardRef, useMemo } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
  useI18n,
} from '@stream-io/video-react-sdk';

import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';
import { LayoutMap } from '../hooks';

export const ToggleLayoutButton = (props: LayoutSelectorProps) => {
  const { onMenuItemClick, selectedLayout } = props;
  const ToggleMenuButtonComponent = useMemo(
    () =>
      forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
        function ToggleMenuButton(buttonProps, ref) {
          const { t } = useI18n();
          return (
            <WithTooltip
              title={t('Layout')}
              tooltipDisabled={buttonProps.menuShown}
            >
              <CompositeButton
                ref={ref}
                active={buttonProps.menuShown}
                variant="primary"
              >
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
