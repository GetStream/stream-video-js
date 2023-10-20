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
  /**
   * Enable HTTP live streaming
   */
  hls?: boolean;
};

/**
 * The HostStartStreamButton component displays and controls the start and end of the host's live stream.
 */
export const HostStartStreamButton = ({
  onEndStreamHandler,
  onStartStreamHandler,
  hls,
}: HostStartStreamButtonProps) => {
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const { useIsCallLive, useIsCallBroadcastingInProgress } =
    useCallStateHooks();
  const {
    theme: {
      colors,
      variants: { iconSizes },
      typefaces,
      hostStartStreamButton,
    },
  } = useTheme();

  const call = useCall();
  const isCallLive = useIsCallLive();
  const isCallBroadcasting = useIsCallBroadcastingInProgress();
  const { t } = useI18n();

  const liveOrBroadcasting = isCallLive || isCallBroadcasting;

  const onStartStreamButtonPress = async () => {
    if (onStartStreamHandler) {
      onStartStreamHandler();
      return;
    }
    try {
      setIsAwaitingResponse(true);
      await call?.goLive();
      if (hls) {
        await call?.startHLS();
      }
      setIsAwaitingResponse(false);
    } catch (error) {
      console.error('Error starting livestream', error);
    }
  };

  const onEndStreamButtonPress = async () => {
    if (onEndStreamHandler) {
      onEndStreamHandler();
      return;
    }
    try {
      setIsAwaitingResponse(true);
      if (hls) {
        await call?.stopHLS();
      } else {
        await call?.stopLive();
      }

      setIsAwaitingResponse(false);
    } catch (error) {
      console.error('Error stopping livestream', error);
    }
  };

  return (
    <Pressable
      disabled={isAwaitingResponse}
      style={[
        styles.container,
        {
          backgroundColor: isAwaitingResponse
            ? colors.dark_gray
            : liveOrBroadcasting
            ? colors.error
            : colors.primary,
        },
        hostStartStreamButton.container,
      ]}
      onPress={
        liveOrBroadcasting ? onEndStreamButtonPress : onStartStreamButtonPress
      }
    >
      <View
        style={[
          styles.icon,
          { height: iconSizes.xs, width: iconSizes.xs },
          hostStartStreamButton.icon,
        ]}
      >
        {isAwaitingResponse ? (
          <ActivityIndicator />
        ) : liveOrBroadcasting ? (
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
          hostStartStreamButton.text,
        ]}
      >
        {isAwaitingResponse
          ? t('Loading...')
          : liveOrBroadcasting
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
