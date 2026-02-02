import { useEffect } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { Lobby } from '../DefaultCall/Lobby';

export type HostBackstageProps = {
  onJoin: () => void;
  skipLobby?: boolean;
};

export const HostBackstage = ({
  onJoin,
  skipLobby = false,
}: HostBackstageProps) => {
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
    <div className="str-video__embedded-backstage">
      <Lobby
        onJoin={onJoin}
        title={t('Prepare for your livestream')}
        subtitle={t('Set up your camera and microphone before going backstage')}
        joinLabel={t('Enter Backstage')}
      />
    </div>
  );
};
