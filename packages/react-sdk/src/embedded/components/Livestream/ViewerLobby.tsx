import { useEffect } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { Lobby } from '../DefaultCall/Lobby';

export type ViewerLobbyProps = {
  onJoin: () => void;
  skipLobby?: boolean;
  isLive?: boolean;
};

export const ViewerLobby = ({
  onJoin,
  skipLobby = false,
  isLive = false,
}: ViewerLobbyProps) => {
  const { t } = useI18n();

  useEffect(() => {
    if (skipLobby) {
      onJoin();
    }
  }, [skipLobby, onJoin]);

  if (skipLobby) {
    return null;
  }

  return (
    <div className="str-video__embedded-viewer-lobby">
      <Lobby
        onJoin={onJoin}
        title={t('Join Livestream')}
        subtitle={
          isLive ? t('The stream is live!') : t('Set up before joining')
        }
        joinLabel={isLive ? t('Watch Now') : t('Join')}
      />
    </div>
  );
};
