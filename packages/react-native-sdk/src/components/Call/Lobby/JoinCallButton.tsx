import React, { useState } from 'react';
import { type LobbyProps } from './Lobby';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { videoLoggerSystem } from '@stream-io/video-client';
import { Button } from '../../utility/Button';

/**
 * Props for the Join Call Button in the Lobby component.
 */
export type JoinCallButtonProps = Pick<LobbyProps, 'onJoinCallHandler'> & {
  onPressHandler?: () => void;
};

/**
 * The default Join call button to be used in the Lobby component.
 */
export const JoinCallButton = ({
  onJoinCallHandler,
  onPressHandler,
}: JoinCallButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const call = useCall();

  const onPress = async () => {
    setIsLoading(true);
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      await call?.join({ create: true });
      if (onJoinCallHandler) {
        onJoinCallHandler();
      }
    } catch (error) {
      const logger = videoLoggerSystem.getLogger('JoinCallButton');
      logger.error('Error joining call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onPress={onPress}
      size="large"
      disabled={isLoading}
      text={isLoading ? t('Joining...') : t('Join')}
    />
  );
};
