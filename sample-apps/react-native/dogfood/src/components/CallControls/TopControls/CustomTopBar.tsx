import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CallAppBarProps,
  CallControlsButton,
  CallDurationIndicator,
  HangUpCallButton,
  ToggleCameraFaceButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { LayoutGrid } from '../../../assets/LayoutGrid';
import { LayoutSpotlight } from '../../../assets/LayoutSpotlight';
import { useLayout } from '../../../contexts/LayoutContext';

/**
 * Toggles the participants layout between grid and spotlight.
 */
const LayoutSwitchButton = () => {
  const {
    theme: { components, semantics },
  } = useTheme();
  const { selectedLayout, onLayoutSelection } = useLayout();

  const Icon = selectedLayout === 'spotlight' ? LayoutSpotlight : LayoutGrid;

  return (
    <CallControlsButton
      onPress={() =>
        onLayoutSelection(selectedLayout === 'grid' ? 'spotlight' : 'grid')
      }
    >
      <View style={styles.icon}>
        <Icon
          color={semantics.buttonSecondaryText}
          size={components.iconSizeMd}
        />
      </View>
    </CallControlsButton>
  );
};

export const CustomTopBar = ({
  onHangupPressHandler,
  onHangupCallHandler,
  style,
}: CallAppBarProps) => {
  const {
    theme: { callAppBar },
  } = useTheme();

  return (
    <View style={[styles.container, callAppBar.container, style]}>
      <View style={styles.leftGroup}>
        <LayoutSwitchButton />
        <ToggleCameraFaceButton />
      </View>
      <View style={styles.durationContainer}>
        <CallDurationIndicator />
      </View>
      <View style={styles.rightGroup}>
        <HangUpCallButton
          onPressHandler={onHangupPressHandler}
          onHangupCallHandler={onHangupCallHandler}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  leftGroup: {
    flexDirection: 'row',
  },
  rightGroup: {
    flexDirection: 'row',
  },
  durationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
