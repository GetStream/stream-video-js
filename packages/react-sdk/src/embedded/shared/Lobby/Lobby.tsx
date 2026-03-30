import clsx from 'clsx';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';
import { DeviceControls } from './DeviceControls';

interface LobbyProps {
  onJoin: () => void;
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

  const { isMute } = useCameraState();
  const settings = useCallSettings();

  const isVideoEnabled = settings?.video.enabled ?? true;
  const resolvedJoinLabel = joinLabel ?? t('Join');
  const resolvedTitle = title ?? t('Set up your call before joining');

  return (
    <div className="str-video__embedded-lobby">
      <div className="str-video__embedded-lobby__content">
        <h1 className="str-video__embedded-lobby__heading">{resolvedTitle}</h1>
        <div
          className={clsx(
            'str-video__embedded-lobby__camera',
            isMute && 'str-video__embedded-lobby__camera--off',
          )}
        >
          <DeviceControls isVideoEnabled={isVideoEnabled} />
        </div>

        <div className="str-video__embedded-lobby__display-name">
          <div className="str-video__embedded-lobby__display-name-label">
            {t('Display name')}
          </div>
          <span className="str-video__embedded-lobby__display-name-value">
            {user?.name}
          </span>
          <button className="str-video__button" onClick={onJoin}>
            <Icon className="str-video__button__icon" icon="login" />
            {resolvedJoinLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
