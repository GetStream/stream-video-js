import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import LayoutSwitcherModal from './LayoutSwitcherModal';
import { ColorValue, LayoutChangeEvent } from 'react-native';
import { Grid } from '../../assets/Grid';
import { SpotLight } from '../../assets/Spotlight';
import { FullScreen } from '../../assets/FullScreen';

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
    case 'fullscreen':
      return <FullScreen color={color} size={size} />;
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
    theme: { colors, defaults, variants },
  } = useTheme();

  const [selectedButton, setSelectedButton] = useState<string>('grid');
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const buttonColor = isPopupVisible
    ? colors.iconPrimaryAccent
    : colors.iconPrimaryDefault;

  const handlePress = () => setIsPopupVisible(true);
  const handleClosePopup = () => setIsPopupVisible(false);

  const handleButtonSelection = (buttonName: string) => {
    setSelectedButton(buttonName);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setAnchorPosition({ x, y: y + height, width, height });
  };

  return (
    <CallControlsButton
      size={variants.iconSizes.lg}
      onLayout={handleLayout}
      onPress={() => {
        handlePress();
        if (onPressHandler) {
          onPressHandler();
        }
        setIsPopupVisible(!isPopupVisible);
      }}
      color={colors.sheetPrimary}
    >
      <IconWrapper>
        {getIcon(selectedButton, buttonColor, variants.iconSizes.lg)}
      </IconWrapper>
      <LayoutSwitcherModal
        isVisible={isPopupVisible}
        anchorPosition={anchorPosition}
        onClose={handleClosePopup}
        onSelectButton={handleButtonSelection}
        selectedButton={selectedButton}
      />
    </CallControlsButton>
  );
};
