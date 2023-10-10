import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts';
import { EndBroadcastIcon, StartStreamIcon } from '../../../icons';

/**
 * Props for the HostStartStreamButton component.
 */
export type HostStartStreamButtonProps = {
  /**
   * Handler to be called when the Start Stream button is pressed.
   * @returns void
   */
  onStartStreamHandler?: () => void;
  /**
   * Handler to be called when the End Stream button is pressed.
   * @returns void
   */
  onEndStreamHandler?: () => void;
};

/**
 * The HostStartStreamButton component displays and controls the start and end of the host's live stream.
 */
export const HostStartStreamButton = ({
  onEndStreamHandler,
  onStartStreamHandler,
}: HostStartStreamButtonProps) => {
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const { useIsCallLive } = useCallStateHooks();
  const {
    theme: {
      colors,
      variants: { iconSizes },
      typefaces,
    },
  } = useTheme();

  const call = useCall();
  const isCallLive = useIsCallLive();
  const { t } = useI18n();

  const onStartStreamButtonPress = async () => {
    if (onStartStreamHandler) {
      onStartStreamHandler();
    }
    try {
      setIsAwaitingResponse(true);
      await call?.goLive();
      setIsAwaitingResponse(false);
    } catch (error) {
      console.error('Error starting livestream', error);
    }
  };

  const onEndStreamButtonPress = async () => {
    if (onEndStreamHandler) {
      onEndStreamHandler();
    }
    try {
      setIsAwaitingResponse(true);
      await call?.stopLive();
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
          backgroundColor: isAwaitingResponse
            ? colors.dark_gray
            : isCallLive
            ? colors.error
            : colors.primary,
        },
      ]}
      onPress={isCallLive ? onEndStreamButtonPress : onStartStreamButtonPress}
    >
      <View
        style={[styles.icon, { height: iconSizes.xs, width: iconSizes.xs }]}
      >
        {isAwaitingResponse ? (
          <ActivityIndicator />
        ) : isCallLive ? (
          <EndBroadcastIcon />
        ) : (
          <StartStreamIcon />
        )}
      </View>
      <Text
        style={[
          styles.text,
          typefaces.subtitleBold,
          { color: colors.static_white },
        ]}
      >
        {isAwaitingResponse
          ? t('Loading...')
          : isCallLive
          ? t('Stop Livestream')
          : t('Start Livestream')}
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
