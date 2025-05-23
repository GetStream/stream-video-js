import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { PhoneDown } from '../../../icons';
import { useCall } from '@stream-io/video-react-bindings';
import { getLogger } from '@stream-io/video-client';

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
  const styles = useStyles();
  const {
    theme: {
      colors,
      variants: { iconSizes },
      viewerLeaveStreamButton,
    },
  } = useTheme();

  const onLeaveStreamButtonPress = async () => {
    if (onLeaveStreamHandler) {
      onLeaveStreamHandler();
      return;
    }
    try {
      setIsAwaitingResponse(true);
      await call?.leave();
      setIsAwaitingResponse(false);
    } catch (error) {
      const logger = getLogger(['ViewerLeaveStreamButton']);
      logger('error', 'Error stopping livestream', error);
    }
  };

  return (
    <Pressable
      style={viewerLeaveStreamButton.container}
      onPress={onLeaveStreamButtonPress}
    >
      <View style={[styles.icon, viewerLeaveStreamButton.icon]}>
        {isAwaitingResponse ? (
          <ActivityIndicator />
        ) : (
          <PhoneDown color={colors.iconPrimary} size={iconSizes.sm} />
        )}
      </View>
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        icon: {
          backgroundColor: theme.colors.buttonSecondary,
          height: theme.variants.buttonSizes.xs,
          width: theme.variants.buttonSizes.xs,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: theme.variants.borderRadiusSizes.sm,
          zIndex: 2,
        },
      }),
    [theme],
  );
};
