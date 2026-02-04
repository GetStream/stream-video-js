import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
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
  const { useCallStartsAt } = useCallStateHooks();
  const startsAt = useCallStartsAt();

  if (skipLobby) {
    return null;
  }

  const getSubtitle = () => {
    if (isLive) return t('The stream is live!');
    if (startsAt) {
      return t('Stream starts at {{time}}', {
        time: startsAt.toLocaleTimeString(),
      });
    }
    return t('Set up before joining the waiting room');
  };

  const getJoinLabel = () => {
    if (isLive) return t('Watch Now');
    return t('Join Waiting Room');
  };

  return (
    <div className="str-video__embedded-viewer-lobby">
      <Lobby
        onJoin={onJoin}
        title={t('Join Livestream')}
        subtitle={getSubtitle()}
        joinLabel={getJoinLabel()}
      />
    </div>
  );
};
