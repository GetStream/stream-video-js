import { useState } from 'react';
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
  onJoin: (displayName: string) => void;
  title?: string;
  subtitle?: string;
  joinLabel?: string;
}

/**
 * Lobby component - Device setup screen before joining a call.
 */
export const Lobby = ({ onJoin, title, subtitle, joinLabel }: LobbyProps) => {
  const { t } = useI18n();
  const user = useConnectedUser();
  const { useCameraState, useMicrophoneState, useCallSession } =
    useCallStateHooks();
  const { isMute: isCameraMute } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();

  const callSession = useCallSession();
  const [isJoining, setIsJoining] = useState(false);

  const [displayNameOverride, setDisplayNameOverride] = useState<string | null>(
    null,
  );

  const displayName = displayNameOverride ?? user?.name ?? '';

  const handleJoin = () => {
    setIsJoining(true);
    onJoin(displayNameOverride ?? '');
  };

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;
  const hasOtherParticipants = (callSession?.participants?.length || 0) > 0;

  const resolvedTitle = title ?? t('Set up your call before joining');
  const resolvedSubtitle =
    subtitle ??
    t('while our Edge Network is selecting the best server for your call...');

  return (
    <div className="str-video__embedded-lobby">
      <div className="str-video__embedded-lobby-container">
        <div className="str-video__embedded-lobby-content">
          <h1 className="str-video__embedded-lobby-heading">{resolvedTitle}</h1>
          <p className="str-video__embedded-lobby-heading__description">
            {resolvedSubtitle}
          </p>

          <div
            className={clsx(
              'str-video__embedded-lobby-camera',
              isCameraMute && 'str-video__embedded-lobby-camera--off',
            )}
          >
            <div className="str-video__embedded-lobby-video-preview">
              <VideoPreview
                DisabledVideoPreview={() => (
                  <div className="str-video__embedded-lobby__no-permission">
                    {hasBrowserMediaPermission ? (
                      <Avatar name={displayName || user?.id} />
                    ) : (
                      <p>
                        {t(
                          'Please grant your browser permission to access your camera and microphone.',
                        )}
                      </p>
                    )}
                  </div>
                )}
              />
              <div className="str-video__embedded-lobby-media-toggle">
                <ToggleAudioPreviewButton Menu={null} />
                <ToggleVideoPreviewButton Menu={null} />
              </div>
            </div>

            <div className="str-video__embedded-lobby-controls">
              <div className="str-video__embedded-lobby-media">
                <ToggleMicButton />
                <ToggleCameraButton />
              </div>
            </div>
          </div>

          <div className="str-video__embedded-display-name">
            <div className="str-video__embedded-display-name-label">
              {t('Display name')}
            </div>
            <input
              className="str-video__embedded-display-name-input str-video__embedded-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayNameOverride(e.target.value)}
              placeholder={t('Enter your name')}
              maxLength={25}
              autoFocus
            />

            <button
              className={clsx(
                'str-video__embedded-button str-video__embedded-button--primary str-video__embedded-button--large str-video__embedded-lobby-join',
                isJoining && 'str-video__embedded-button--disabled',
              )}
              onClick={handleJoin}
              disabled={isJoining || !displayName.trim()}
            >
              <Icon className="str-video__embedded-button__icon" icon="login" />
              {isJoining
                ? t('Joining')
                : (joinLabel ??
                  (hasOtherParticipants ? t('Join') : t('Start call')))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
