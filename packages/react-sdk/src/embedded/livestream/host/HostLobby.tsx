import { useI18n } from '@stream-io/video-react-bindings';
import { Lobby } from '../../shared/Lobby/Lobby';

export type HostLobbyProps = {
  onJoin: () => void;
  isBackstageEnabled: boolean;
};

export const HostLobby = ({ onJoin, isBackstageEnabled }: HostLobbyProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-host-lobby">
      <Lobby
        onJoin={onJoin}
        title={
          isBackstageEnabled
            ? t('Prepare your livestream')
            : t('Ready to go live')
        }
        joinLabel={isBackstageEnabled ? t('Enter Backstage') : t('Go Live')}
      />
    </div>
  );
};
