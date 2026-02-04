import { useEffect, useRef } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { Lobby } from '../DefaultCall/Lobby';
import { useEmbeddedConfiguration } from '../../context';

export type HostBackstageProps = {
  onJoin: () => void;
};

export const HostBackstage = ({ onJoin }: HostBackstageProps) => {
  const { t } = useI18n();
  const { skipLobby } = useEmbeddedConfiguration();
  const hasInitiatedJoin = useRef(false);

  useEffect(() => {
    if (skipLobby && !hasInitiatedJoin.current) {
      hasInitiatedJoin.current = true;
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
        joinLabel={t('Enter Backstage')}
      />
    </div>
  );
};
