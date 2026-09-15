import React, { useCallback } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { Z_INDEX } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import { MoreVert } from '../../../icons/MoreVert';
import { MessageBubbles, ControlButtonIcon, Users } from '../../../icons';
import {
  CallControlsButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '.';

/**
 * Props for the CallControls Component.
 */
export type CallControlProps = Pick<ViewProps, 'style'> & {
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
  onMorePress?: () => void;
  onUsersPress?: () => void;
  onMessageBubblesPress?: () => void;
  /**
   * Reports the measured height of the controls container whenever it changes.
   *
   * Surfaces that have to sit directly above the controls — a bottom sheet
   * opened from `onMorePress`, for example — need this to position themselves,
   * and they cannot measure it themselves when the controls are rendered by the
   * SDK.
   */
  onControlsHeightChange?: (height: number) => void;
};

/**
 * A list/row of controls (mute audio/video, toggle front/back camera, hangup call etc.)
 * the user can trigger within an active call.
 */
export const CallControls = ({
  style,
  onMorePress,
  onUsersPress,
  onMessageBubblesPress,
  onControlsHeightChange,
}: CallControlProps) => {
  const {
    theme: { callControls },
  } = useTheme();

  const onLayout = useCallback<NonNullable<ViewProps['onLayout']>>(
    (event) => onControlsHeightChange?.(event.nativeEvent.layout.height),
    [onControlsHeightChange],
  );

  return (
    <View
      style={[styles.container, callControls.container, style]}
      onLayout={onControlsHeightChange ? onLayout : undefined}
    >
      <View style={styles.leftGroup}>
        {onMorePress && (
          <CallControlsButton onPress={onMorePress}>
            <ControlButtonIcon icon={MoreVert} />
          </CallControlsButton>
        )}
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
      </View>
      <View style={styles.rightGroup}>
        {onUsersPress && (
          <CallControlsButton onPress={onUsersPress}>
            <ControlButtonIcon icon={Users} />
          </CallControlsButton>
        )}
        {onMessageBubblesPress && (
          <CallControlsButton onPress={onMessageBubblesPress}>
            <ControlButtonIcon icon={MessageBubbles} />
          </CallControlsButton>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: Z_INDEX.IN_FRONT,
  },
  leftGroup: {
    flexDirection: 'row',
  },
  rightGroup: {
    flexDirection: 'row',
  },
});
