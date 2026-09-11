import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { Z_INDEX } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { CallDurationIndicator } from '../../utility/CallDurationIndicator';
import {
  HangUpCallButton,
  HangUpCallButtonProps,
  LayoutSwitchButton,
  ToggleCameraFaceButton,
} from '.';

/**
 * Props for the CallAppBar Component.
 */
export type CallAppBarProps = Pick<ViewProps, 'style'> &
  Pick<HangUpCallButtonProps, 'onHangupCallHandler'> & {
    layout?: 'grid' | 'spotlight';
    onHangupPressHandler?: () => void;
    onLayoutToggleHandler?: (newLayout: 'grid' | 'spotlight') => void;
  };
/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallAppBar = ({
  layout,
  onHangupPressHandler,
  onHangupCallHandler,
  onLayoutToggleHandler,
  style,
}: CallAppBarProps) => {
  const {
    theme: { callAppBar },
  } = useTheme();

  return (
    <View style={[styles.container, callAppBar.container, style]}>
      <View style={styles.leftGroup}>
        <LayoutSwitchButton
          layout={layout}
          onLayoutToggleHandler={onLayoutToggleHandler}
        />
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
    zIndex: Z_INDEX.IN_FRONT,
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
});
