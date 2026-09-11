import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts';
import { EndBroadcastIcon, StartStreamIcon } from '../../../icons';
import { SfuModels, videoLoggerSystem } from '@stream-io/video-client';
import { Button } from '../../utility/Button';

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
    theme: { components, semantics },
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
      const logger = videoLoggerSystem.getLogger('HostStartStreamButton');
      logger.error('Error starting livestream', error);
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
      const logger = videoLoggerSystem.getLogger('HostStartStreamButton');
      logger.error('Error stopping livestream', error);
    }
  };

  const onPress = async () => {
    if (liveOrBroadcasting) {
      await onEndStreamButtonPress();
    } else {
      await onStartStreamButtonPress();
    }
  };

  const renderIcon = () => {
    if (isAwaitingResponse) {
      return <ActivityIndicator />;
    }
    if (liveOrBroadcasting) {
      return (
        <EndBroadcastIcon
          color={semantics.textOnAccent}
          size={components.iconSizeMd}
        />
      );
    }
    return (
      <StartStreamIcon
        color={semantics.textOnAccent}
        size={components.iconSizeMd}
      />
    );
  };

  const text = isAwaitingResponse
    ? t('Loading...')
    : liveOrBroadcasting
      ? t('Stop Livestream')
      : t('Start Livestream');

  return (
    <Button
      text={text}
      disabled={isAwaitingResponse}
      leftAccessory={renderIcon}
      onPress={onPress}
    />
  );
};
