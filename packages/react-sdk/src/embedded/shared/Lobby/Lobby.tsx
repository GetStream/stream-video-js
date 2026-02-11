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

interface LobbyProps {
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

const PermissionMessage = ({ message }: { message: string }) => (
  <div className="str-video__embedded-lobby__no-permission">
    <p>{message}</p>
  </div>
);

const DisabledVideoPreview = () => {
  const { t } = useI18n();
  const user = useConnectedUser();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  return (
    <div className="str-video__embedded-lobby__no-permission">
      {hasBrowserMediaPermission ? (
        <Avatar imageSrc={user?.image} name={user?.name || user?.id} />
      ) : (
        <p>
          {t(
            'Please grant your browser permission to access your camera and microphone.',
          )}
        </p>
      )}
    </div>
  );
};

const NoCameraPreview = () => {
  const { t } = useI18n();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  if (!hasBrowserMediaPermission) {
    return (
      <PermissionMessage
        message={t(
          'Please grant your browser permission to access your camera and microphone.',
        )}
      />
    );
  }

  return (
    <div className="str-video__video-preview__no-camera-preview">
      {t('No camera found')}
    </div>
  );
};

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
  const hasOtherParticipants = (callSession?.participants?.length || 0) > 0;
  const isVideoEnabled = settings?.video.enabled ?? true;
  const resolvedTitle = title ?? t('Set up your call before joining');

  const handleJoin = useCallback(() => {
    setIsJoining(true);
    onJoin();
  }, [onJoin]);

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
            disabled={isJoining}
          >
            <Icon className="str-video__button__icon" icon="login" />
            {isJoining ? t('Joining') : resolvedJoinLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
