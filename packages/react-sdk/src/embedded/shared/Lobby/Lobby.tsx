import clsx from 'clsx';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
import { Button, Icon } from '../../../components';
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
  const { useCameraState, useCallSettings } = useCallStateHooks();

  const { isMute } = useCameraState();
  const settings = useCallSettings();

  const isVideoEnabled = settings?.video.enabled ?? true;
  const resolvedJoinLabel = joinLabel ?? t('lobby.join.label', 'Join');
  const resolvedTitle =
    title ?? t('lobby.setUpYourCall.title', 'Set up your call before joining');

  return (
    <div className="str-video__embedded-lobby">
      <div className="str-video__embedded-lobby__content">
        <div className="str-video__embedded-lobby__title">
          <Icon
            icon="language"
            className="str-video__embedded-lobby__title-icon"
          />
          <h1 className="str-video__embedded-lobby__heading">
            {resolvedTitle}
          </h1>
        </div>
        <div
          className={clsx(
            'str-video__embedded-lobby__camera',
            isMute && 'str-video__embedded-lobby__camera--off',
          )}
        >
          <DeviceControls isVideoEnabled={isVideoEnabled} />
        </div>

        <Button className="str-video__embedded-lobby__join" onClick={onJoin}>
          <Icon icon="login" />
          {resolvedJoinLabel}
        </Button>
      </div>
    </div>
  );
};
