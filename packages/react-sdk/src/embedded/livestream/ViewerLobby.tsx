import { useI18n } from '@stream-io/video-react-bindings';
import { Lobby } from '../meeting/lobby/Lobby';

export type ViewerLobbyProps = {
  onJoin: () => void;
  isLive?: boolean;
};

export const ViewerLobby = ({ onJoin, isLive = false }: ViewerLobbyProps) => {
  const { t } = useI18n();

  const getJoinLabel = () => {
    if (isLive) return t('Watch Now');
    return t('Join Waiting Room');
  };

  return (
    <div className="str-video__embedded-viewer-lobby">
      <Lobby
        onJoin={onJoin}
        title={t('Join Livestream')}
        joinLabel={getJoinLabel()}
      />
    </div>
  );
};
