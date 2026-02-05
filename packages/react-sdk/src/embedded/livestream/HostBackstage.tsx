import { useI18n } from '@stream-io/video-react-bindings';
import { Lobby } from '../meeting/lobby/Lobby';

export type HostBackstageProps = {
  onJoin: () => void;
};

export const HostBackstage = ({ onJoin }: HostBackstageProps) => {
  const { t } = useI18n();

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
