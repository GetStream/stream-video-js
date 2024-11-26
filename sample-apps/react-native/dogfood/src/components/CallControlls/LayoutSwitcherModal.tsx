import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { Grid } from '../../assets/Grid';
import { SpotLight } from '../../assets/Spotlight';
import { Layout, useLayout } from '../../contexts/LayoutContext';

interface AnchorPosition {
  x: number;
  y: number;
  height: number;
}

interface PopupComponentProps {
  anchorPosition?: AnchorPosition | null;
  isVisible: boolean;
  onClose: () => void;
}

const LayoutSwitcherModal: React.FC<PopupComponentProps> = ({
  isVisible,
  onClose,
  anchorPosition,
}) => {
  const { theme } = useTheme();
  const styles = useStyles();
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const { selectedLayout, onLayoutSelection } = useLayout();
  const topInset = theme.variants.insets.top;
  const leftInset = theme.variants.insets.left;

  useEffect(() => {
    if (isVisible && anchorPosition) {
      const windowHeight = Dimensions.get('window').height;
      const windowWidth = Dimensions.get('window').width;
      let top = anchorPosition.y + anchorPosition.height / 2 + topInset;
      let left = anchorPosition.x + leftInset + 6;

      // Ensure the popup stays within the screen bounds
      if (top + 150 > windowHeight) {
        top = anchorPosition.y - 150;
      }
      if (left + 200 > windowWidth) {
        left = windowWidth - 200;
      }

      setPopupPosition({ top, left });
    }
  }, [isVisible, anchorPosition, topInset, leftInset]);

  if (!isVisible || !anchorPosition) {
    return null;
  }

  const onPressHandler = (layout: Layout) => {
    onLayoutSelection(layout);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.modal,
            { top: popupPosition.top, left: popupPosition.left },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              selectedLayout === 'grid' && styles.selectedButton,
            ]}
            onPress={() => onPressHandler('grid')}
          >
            <Grid
              size={theme.variants.iconSizes.md}
              color={theme.colors.iconPrimary}
            />
            <Text style={styles.buttonText}>Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              selectedLayout === 'spotlight' && styles.selectedButton,
            ]}
            onPress={() => onPressHandler('spotlight')}
          >
            <SpotLight
              size={theme.variants.iconSizes.md}
              color={theme.colors.iconPrimary}
            />
            <Text style={styles.buttonText}>Spotlight</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
        },
        modal: {
          position: 'absolute',
          width: 212,
          backgroundColor: theme.colors.sheetSecondary,
          borderRadius: theme.variants.borderRadiusSizes.md,
          padding: theme.variants.spacingSizes.md,
          gap: theme.variants.spacingSizes.sm,
        },
        button: {
          backgroundColor: theme.colors.buttonSecondary,
          borderRadius: theme.variants.borderRadiusSizes.lg,
          borderWidth: 1,
          borderColor: theme.colors.sheetTertiary,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: theme.variants.spacingSizes.md,
          paddingVertical: theme.variants.spacingSizes.sm,
        },
        selectedButton: {
          backgroundColor: theme.colors.buttonPrimary,
        },
        buttonText: {
          color: theme.colors.textPrimary,
          textAlign: 'center',
          fontWeight: '600',
          marginTop: 2,
          marginLeft: theme.variants.spacingSizes.xs,
        },
      }),
    [theme],
  );
};

export default LayoutSwitcherModal;
