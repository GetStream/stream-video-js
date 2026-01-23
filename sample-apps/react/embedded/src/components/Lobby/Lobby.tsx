import { useEffect, useState } from 'react';
import {
  Avatar,
  Icon,
  LoadingIndicator,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  useConnectedUser,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import { ToggleMicButton } from './ToggleMicButton';
import { ToggleCameraButton } from './ToggleCameraButton';

export type LobbyProps = {
  onJoin: (displayName?: string) => void;
  skipLobby?: boolean;
  title?: string;
  subtitle?: string;
  joinLabel?: string;
};

export const Lobby = ({
  onJoin,
  skipLobby = false,
  title = 'Set up your call before joining',
  subtitle = 'while our Edge Network is selecting the best server for your call...',
  joinLabel,
}: LobbyProps) => {
  const user = useConnectedUser();
  const { useCameraState, useMicrophoneState, useCallSession } =
    useCallStateHooks();
  const { isMute: isCameraMute } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();

  const callSession = useCallSession();
  const [isJoining, setIsJoining] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');

  useEffect(() => {
    if (!skipLobby) return;
    const id = setTimeout(() => {
      onJoin(displayName);
    }, 500);
    return () => {
      clearTimeout(id);
    };
  }, [onJoin, skipLobby, displayName]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  const handleJoin = () => {
    setIsJoining(true);
    onJoin(displayName);
  };

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;
  const hasOtherParticipants = (callSession?.participants?.length || 0) > 0;

  if (skipLobby) {
    return (
      <div className="str-video__call">
        <div className="str-video__call__loading-screen">
          <LoadingIndicator />
        </div>
      </div>
    );
  }

  return (
    <div className="rd__lobby">
      <div className="rd__lobby-container">
        <div className="rd__lobby-content">
          <h1 className="rd__lobby-heading">{title}</h1>
          <p className="rd__lobby-heading__description">{subtitle}</p>

          <div
            className={`rd__lobby-camera${isCameraMute ? ' rd__lobby-camera--off' : ''}`}
          >
            <div className="rd__lobby-video-preview">
              <VideoPreview
                DisabledVideoPreview={() => (
                  <div className="rd__lobby__no-permission">
                    {hasBrowserMediaPermission ? (
                      <Avatar name={displayName || user?.id} />
                    ) : (
                      <p>
                        Please grant your browser permission to access your
                        camera and microphone.
                      </p>
                    )}
                  </div>
                )}
              />
              <div className="rd__lobby-media-toggle">
                <ToggleAudioPreviewButton Menu={null} />
                <ToggleVideoPreviewButton Menu={null} />
              </div>
            </div>

            <div className="rd__lobby-controls">
              <div className="rd__lobby-media">
                <ToggleMicButton />
                <ToggleCameraButton />
              </div>
            </div>
          </div>

          <div className="rd__display-name">
            <div className="rd__display-name-label">Choose display name</div>
            <input
              className="rd__display-name-input rd__input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={25}
              autoFocus
            />

            <button
              className={`rd__button rd__button--primary rd__button--large rd__lobby-join${isJoining ? ' rd__button--disabled' : ''}`}
              onClick={handleJoin}
              disabled={isJoining || !displayName.trim()}
            >
              <Icon className="rd__button__icon" icon="login" />
              {isJoining
                ? 'Joining...'
                : (joinLabel ?? (hasOtherParticipants ? 'Join' : 'Start call'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
