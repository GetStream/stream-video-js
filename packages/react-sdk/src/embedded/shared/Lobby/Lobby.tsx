import { useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import {
  Avatar,
  Icon,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  VideoPreview,
} from '../../../components';
import { ToggleMicButton } from './ToggleMicButton';
import { ToggleCameraButton } from './ToggleCameraButton';

export interface LobbyProps {
  onJoin: (displayName?: string) => void;
  title?: string;
  joinLabel?: string;
}

interface DisabledDeviceButtonProps {
  icon: string;
  label: string;
}

const DisabledDeviceButton = ({ icon, label }: DisabledDeviceButtonProps) => (
  <div className="str-video__embedded-lobby__device-button str-video__embedded-lobby__device-button--disabled">
    <Icon
      className="str-video__embedded-lobby__device-button-icon"
      icon={icon}
    />
    <span className="str-video__embedded-lobby__device-button-label">
      {label}
    </span>
  </div>
);

interface PermissionMessageProps {
  message: string;
}

const PermissionMessage = ({ message }: PermissionMessageProps) => (
  <div className="str-video__embedded-lobby__no-permission">
    <p>{message}</p>
  </div>
);

/**
 * Lobby component - Device setup screen before joining a call.
 */
export const Lobby = ({ onJoin, title, joinLabel }: LobbyProps) => {
  const { t } = useI18n();
  const user = useConnectedUser();
  const {
    useCameraState,
    useMicrophoneState,
    useCallSession,
    useCallSettings,
  } = useCallStateHooks();

  const { isMute: isCameraMute, hasBrowserPermission: hasCameraPermission } =
    useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const settings = useCallSettings();
  const callSession = useCallSession();

  const [isJoining, setIsJoining] = useState(false);

  const displayName = user?.name ?? '';
  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;
  const hasOtherParticipants = (callSession?.participants?.length || 0) > 0;
  const isVideoEnabled = settings?.video.enabled ?? true;
  const resolvedTitle = title ?? t('Set up your call before joining');
  const permissionMessage = t(
    'Please grant your browser permission to access your camera and microphone.',
  );

  const handleJoin = useCallback(() => {
    setIsJoining(true);
    onJoin();
  }, [onJoin]);

  const DisabledVideoPreview = useCallback(
    () => (
      <div className="str-video__embedded-lobby__no-permission">
        {hasBrowserMediaPermission ? (
          <Avatar imageSrc={user?.image} name={displayName || user?.id} />
        ) : (
          <p>{permissionMessage}</p>
        )}
      </div>
    ),
    [
      hasBrowserMediaPermission,
      user?.image,
      user?.id,
      displayName,
      permissionMessage,
    ],
  );

  const NoCameraPreview = useCallback(
    () =>
      !hasBrowserMediaPermission ? (
        <PermissionMessage message={permissionMessage} />
      ) : (
        <div className="str_video__video-preview__no-camera-preview">
          {t('No camera found')}
        </div>
      ),
    [hasBrowserMediaPermission, permissionMessage, t],
  );

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
          <div className="str-video__embedded-lobby__video-preview">
            <VideoPreview
              DisabledVideoPreview={DisabledVideoPreview}
              NoCameraPreview={NoCameraPreview}
            />
            <div className="str-video__embedded-lobby__media-toggle">
              <ToggleAudioPreviewButton Menu={null} />
              {isVideoEnabled && <ToggleVideoPreviewButton Menu={null} />}
            </div>
          </div>

          <div className="str-video__embedded-lobby__media">
            {hasMicPermission ? (
              <ToggleMicButton />
            ) : (
              <DisabledDeviceButton icon="mic" label={t('Permission needed')} />
            )}
            {isVideoEnabled &&
              (hasCameraPermission ? (
                <ToggleCameraButton />
              ) : (
                <DisabledDeviceButton
                  icon="camera"
                  label={t('Permission needed')}
                />
              ))}
          </div>
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
            disabled={isJoining || !displayName.trim()}
          >
            <Icon className="str-video__button__icon" icon="login" />
            {isJoining ? t('Joining') : resolvedJoinLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
