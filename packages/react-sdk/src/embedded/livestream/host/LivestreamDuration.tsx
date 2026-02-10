import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { humanize } from '@stream-io/video-client';
import { Icon } from '../../../components';

export const LivestreamDuration = () => {
  const { t } = useI18n();
  const { useIsCallLive, useParticipantCount } = useCallStateHooks();
  const isLive = useIsCallLive();
  const participantCount = useParticipantCount();

  return (
    <div className="str-video__livestream-duration">
      <span
        className={
          isLive
            ? 'str-video__livestream-duration__live-badge'
            : 'str-video__livestream-duration__backstage-badge'
        }
      >
        {isLive ? t('Live') : t('Backstage')}
      </span>
      <div className="str-video__livestream-duration__viewers">
        <Icon icon="eye" className="str-video__livestream-duration__eye-icon" />
        <span className="str-video__livestream-duration__count">
          {humanize(participantCount)}
        </span>
      </div>
    </div>
  );
};
