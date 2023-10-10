import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts';
import { LeaveStreamIcon } from '../../../icons';
import { useCall, useI18n } from '@stream-io/video-react-bindings';

/**
 * Props for the ViewerLeaveStreamButton component.
 */
export type ViewerLeaveStreamButtonProps = {
  /**
   * Handler to be called when the viewer's leave stream button is called.
   * @returns void
   */
  onLeaveStreamHandler?: () => void;
};

/**
 * The ViewerLeaveStreamButton component displays and controls the leave stream logic of the viewer's live stream.
 */
export const ViewerLeaveStreamButton = ({
  onLeaveStreamHandler,
}: ViewerLeaveStreamButtonProps) => {
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const call = useCall();
  const { t } = useI18n();
  const {
    theme: {
      colors,
      variants: { iconSizes },
      typefaces,
    },
  } = useTheme();

  const onLeaveStreamButtonPress = async () => {
    if (onLeaveStreamHandler) {
      onLeaveStreamHandler();
    }
    try {
      setIsAwaitingResponse(true);
      await call?.leave();
      setIsAwaitingResponse(false);
    } catch (error) {
      console.error('Error stopping livestream', error);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.dark_gray,
        },
      ]}
      onPress={onLeaveStreamButtonPress}
    >
      <View
        style={[styles.icon, { height: iconSizes.xs, width: iconSizes.xs }]}
      >
        {isAwaitingResponse ? <ActivityIndicator /> : <LeaveStreamIcon />}
      </View>
      <Text
        style={[
          styles.text,
          typefaces.subtitleBold,
          { color: colors.static_white },
        ]}
      >
        {isAwaitingResponse ? t('Loading...') : t('Leave Stream')}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
  },
  icon: {},
  text: {
    marginLeft: 8,
    includeFontPadding: false,
  },
});
