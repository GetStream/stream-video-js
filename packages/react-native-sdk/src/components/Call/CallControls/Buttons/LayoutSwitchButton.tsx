import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ControlButtonIcon, Grid, Spotlight } from '../../../../icons';
import { CallControlsButton } from '..';

export type LayoutSwitchButtonProps = {
  /**
   * The current layout of the call participants.
   */
  layout?: 'grid' | 'spotlight';
  /**
   * Handler to be called when the layout switcher button is pressed.
   * @returns void
   */
  onLayoutToggleHandler?: (newLayout: 'grid' | 'spotlight') => void;
};

const getIcon = (selectedButton: string) => {
  switch (selectedButton) {
    case 'grid':
      return Grid;
    case 'spotlight':
      return Spotlight;
    default:
      return Grid;
  }
};

/**
 * The layout switcher Button can be used to switch different layout arrangements
 * of the call participants.
 */
export const LayoutSwitchButton = ({
  layout,
  onLayoutToggleHandler,
}: LayoutSwitchButtonProps) => {
  const {} = useTheme();

  const onPress = () => {
    if (onLayoutToggleHandler) {
      onLayoutToggleHandler(layout === 'grid' ? 'spotlight' : 'grid');
    }
  };

  return (
    <CallControlsButton onPress={onPress}>
      <ControlButtonIcon icon={getIcon(layout ?? 'grid')} />
    </CallControlsButton>
  );
};
