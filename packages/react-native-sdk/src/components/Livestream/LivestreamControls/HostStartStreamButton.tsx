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
import { SfuModels, getLogger } from '@stream-io/video-client';

/**
 * Props for the HostStartStreamButton component.
 */
export type HostStartStreamButtonProps = {
  /**
   * Handler to be called after the Start Stream button is pressed.
   * @returns void
   */
  onStartStreamHandler?: () => void;
  /**
   * Handler to be called after the End Stream button is pressed.
   * @returns void
   */
  onEndStreamHandler?: () => void;
  /**
   * Enable HTTP live streaming
   */
  hls?: boolean;
  /**
   * Disable the published streams to not be stopped if the host ends the livestream.
   */
  disableStopPublishedStreamsOnEndStream?: boolean;
};

/**
 * The HostStartStreamButton component displays and controls the start and end of the host's live stream.
 */
export const HostStartStreamButton = ({
  onEndStreamHandler,
  onStartStreamHandler,
  hls,
  disableStopPublishedStreamsOnEndStream,
}: HostStartStreamButtonProps) => {
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const { useIsCallLive, useIsCallHLSBroadcastingInProgress } =
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
  const isCallBroadcasting = useIsCallHLSBroadcastingInProgress();
  const { t } = useI18n();

  const liveOrBroadcasting = isCallLive || isCallBroadcasting;

  const onStartStreamButtonPress = async () => {
    try {
      setIsAwaitingResponse(true);
      await call?.goLive();
      if (hls) {
        await call?.startHLS();
      }
      setIsAwaitingResponse(false);
      if (onStartStreamHandler) {
        onStartStreamHandler();
      }
    } catch (error) {
      const logger = getLogger(['HostStartStreamButton']);
      logger('error', 'Error starting livestream', error);
    }
  };

  const onEndStreamButtonPress = async () => {
    try {
      setIsAwaitingResponse(true);
      if (!disableStopPublishedStreamsOnEndStream) {
        await call?.stopPublish(SfuModels.TrackType.VIDEO);
        await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
      }
      if (hls) {
        await call?.stopHLS();
      } else {
        await call?.stopLive();
      }

      setIsAwaitingResponse(false);
      if (onEndStreamHandler) {
        onEndStreamHandler();
      }
    } catch (error) {
      const logger = getLogger(['HostStartStreamButton']);
      logger('error', 'Error stopping livestream', error);
    }
  };

  return (
    <Pressable
      disabled={isAwaitingResponse}
      style={[
        styles.container,
        {
          backgroundColor: isAwaitingResponse
            ? colors.sheetTertiary
            : liveOrBroadcasting
              ? colors.buttonWarning
              : colors.buttonPrimary,
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
          { color: colors.textPrimary },
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
