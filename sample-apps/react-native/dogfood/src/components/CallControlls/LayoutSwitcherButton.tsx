import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import LayoutSwitcherModal from './LayoutSwitcherModal';
import { ColorValue } from 'react-native';
import { Grid } from '../../assets/Grid';
import { SpotLight } from '../../assets/Spotlight';
import { useLayout } from '../../contexts/LayoutContext';

export type LayoutSwitcherButtonProps = {
  /**
   * Handler to be called when the layout switcher button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

const getIcon = (selectedButton: string, color: ColorValue, size: number) => {
  switch (selectedButton) {
    case 'grid':
      return <Grid color={color} size={size} />;
    case 'spotlight':
      return <SpotLight color={color} size={size} />;
    default:
      return 'grid';
  }
};

/**
 * The layout switcher Button can be used to switch different layout arrangements
 * of the call participants.
 */
export const LayoutSwitcherButton = ({
  onPressHandler,
}: LayoutSwitcherButtonProps) => {
  const {
    theme: { colors, variants },
  } = useTheme();

  const { selectedLayout } = useLayout();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const buttonColor = isModalVisible
    ? colors.iconSecondary
    : colors.iconPrimary;

  const handleOpenModal = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);

  const handleLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setAnchorPosition({ x, y: y + height, width, height });
  };

  return (
    <CallControlsButton
      size={variants.roundButtonSizes.md}
      onLayout={handleLayout}
      onPress={() => {
        handleOpenModal();
        if (onPressHandler) {
          onPressHandler();
        }
        setIsModalVisible(!isModalVisible);
      }}
      color={colors.sheetPrimary}
    >
      <IconWrapper>
        {getIcon(selectedLayout, buttonColor, variants.iconSizes.lg)}
      </IconWrapper>
      <LayoutSwitcherModal
        isVisible={isModalVisible}
        anchorPosition={anchorPosition}
        onClose={handleCloseModal}
      />
    </CallControlsButton>
  );
};
