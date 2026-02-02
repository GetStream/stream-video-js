import { forwardRef, useMemo } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
} from '../../../../components';

import { Layouts } from '../../../layouts';
import {
  LayoutSelector,
  LayoutSelectorProps,
  LayoutSelectorType,
} from './LayoutSelector';

export const ToggleLayoutButton = (props: LayoutSelectorProps) => {
  const { t } = useI18n();
  const { onMenuItemClick, selectedLayout } = props;

  const ToggleMenuButtonComponent = useMemo(
    () =>
      forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
        function ToggleMenuButton(buttonProps, ref) {
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
                <Icon icon={Layouts[selectedLayout]?.icon || 'grid'} />
              </CompositeButton>
            </WithTooltip>
          );
        },
      ),
    [selectedLayout, t],
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
