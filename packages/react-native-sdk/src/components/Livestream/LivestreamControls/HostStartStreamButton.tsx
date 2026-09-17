import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
import { useTheme } from '../../../contexts';
import { StartStreamIcon } from '../../../icons';
import { videoLoggerSystem } from '@stream-io/video-client';
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
   * Enable HTTP live streaming
   */
  hls?: boolean;
};

/**
 * The HostStartStreamButton component displays and controls the start and end of the host's live stream.
 */
export const HostStartStreamButton = ({
  onStartStreamHandler,
  hls,
}: HostStartStreamButtonProps) => {
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const { useIsCallLive, useIsCallHLSBroadcastingInProgress } =
    useCallStateHooks();
  const isCallLive = useIsCallLive();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  const liveOrBroadcasting = isCallLive || isBroadcasting;
  const {
    theme: { components, semantics },
  } = useTheme();

  const call = useCall();
  const { t } = useI18n();

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

  const onPress = async () => {
    await onStartStreamButtonPress();
  };

  const renderIcon = () => {
    if (isAwaitingResponse) {
      return <ActivityIndicator />;
    }

    return (
      <StartStreamIcon
        color={semantics.textOnAccent}
        size={components.iconSizeMd}
      />
    );
  };

  const text = isAwaitingResponse
    ? t('common.loading.text', 'Loading...')
    : t('livestreamControls.start.label', 'Start');

  if (liveOrBroadcasting) {
    return null;
  }

  return (
    <Button
      text={text}
      disabled={isAwaitingResponse}
      leftAccessory={renderIcon}
      onPress={onPress}
    />
  );
};
