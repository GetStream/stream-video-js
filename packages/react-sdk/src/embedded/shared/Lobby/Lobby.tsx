import { useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';
import { useEmbeddedConfiguration } from '../../context';
import { DeviceControls } from './DeviceControls';

interface LobbyProps {
  onJoin: () => Promise<void>;
  title?: string;
  joinLabel?: string;
}

/**
 * Lobby component - Device setup screen before joining a call.
 */
export const Lobby = ({ onJoin, title, joinLabel }: LobbyProps) => {
  const { t } = useI18n();
  const user = useConnectedUser();
  const { useCameraState, useCallSettings } = useCallStateHooks();

  const { isMute: isCameraMute } = useCameraState();
  const settings = useCallSettings();
  const { onError } = useEmbeddedConfiguration();

  const [showError, setShowError] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState(false);

  const isVideoEnabled = settings?.video.enabled ?? true;
  const resolvedJoinLabel = joinLabel ?? t('Join');
  const resolvedTitle = title ?? t('Set up your call before joining');

  const handleJoin = useCallback(async () => {
    setIsJoining(true);
    setShowError(false);

    try {
      await onJoin();
    } catch (e) {
      onError?.(e);
      setShowError(true);
    } finally {
      setIsJoining(false);
    }
  }, [onJoin, onError]);

  return (
    <div className="str-video__embedded-lobby">
      <div className="str-video__embedded-lobby__content">
        <h1 className="str-video__embedded-lobby__heading">{resolvedTitle}</h1>
        <div
          className={clsx(
            'str-video__embedded-lobby__camera',
            isCameraMute && 'str-video__embedded-lobby__camera--off',
          )}
        >
          <DeviceControls isVideoEnabled={isVideoEnabled} />
        </div>

        <div className="str-video__embedded-lobby__display-name">
          {user?.name && (
            <>
              <div className="str-video__embedded-lobby__display-name-label">
                {t('Display name')}
              </div>
              <span className="str-video__embedded-lobby__display-name-value">
                {user?.name}
              </span>
            </>
          )}

          <button
            className="str-video__button"
            onClick={handleJoin}
            disabled={isJoining}
          >
            <Icon className="str-video__button__icon" icon="login" />
            {resolvedJoinLabel}
          </button>
        </div>
        <div
          className="str-video__embedded-lobby__join-error"
          data-visible={showError}
        >
          {t('Failed to join. Please try again.')}
        </div>
      </div>
    </div>
  );
};
