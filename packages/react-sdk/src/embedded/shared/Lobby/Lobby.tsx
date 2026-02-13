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
  const { useCameraState, useCallSession, useCallSettings } =
    useCallStateHooks();

  const { isMute: isCameraMute } = useCameraState();
  const settings = useCallSettings();
  const callSession = useCallSession();
  const { onError } = useEmbeddedConfiguration();

  const [showError, setShowError] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState(false);

  const displayName = user?.name ?? '';
  const hasOtherParticipants = (callSession?.participants?.length || 0) > 0;
  const isVideoEnabled = settings?.video.enabled ?? true;
  const resolvedTitle = title ?? t('Set up your call before joining');

  const handleJoin = useCallback(async () => {
    setIsJoining(true);
    setShowError(false);

    try {
      await onJoin();
    } catch (e) {
      onError?.(e);
      setShowError(true);
      setIsJoining(false);
    }
  }, [onJoin, onError]);

  const resolvedJoinLabel =
    joinLabel ?? (hasOtherParticipants ? t('Join') : t('Start call'));

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
          <div className="str-video__embedded-lobby__display-name-label">
            {t('Display name')}
          </div>
          <span className="str-video__embedded-lobby__display-name-value">
            {displayName}
          </span>

          <button
            className="str-video__button"
            onClick={handleJoin}
            disabled={isJoining}
          >
            <Icon className="str-video__button__icon" icon="login" />
            {resolvedJoinLabel}
          </button>
        </div>
        <p
          className="str-video__embedded-lobby__join-error"
          role="status"
          aria-live="polite"
          data-visible={showError}
        >
          {t('Failed to join. Please try again.')}
        </p>
      </div>
    </div>
  );
};
