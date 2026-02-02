import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { LivestreamLayout } from '../../../core';
import {
  CancelCallButton,
  Icon,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  WithTooltip,
} from '../../../components';

export type LivestreamViewProps = {
  onStopLive: () => void;
};

export const LivestreamView = ({ onStopLive }: LivestreamViewProps) => {
  const { useHasPermissions } = useCallStateHooks();
  // Hosts have JOIN_BACKSTAGE capability - use this for UI decisions
  const isHost = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

  return (
    <div className="str-video__embedded-call str-video__embedded-livestream">
      <div className="str-video__embedded-main-panel">
        <LivestreamHeader />
        <div className="str-video__embedded-layout">
          <div className="str-video__embedded-layout__stage">
            <LivestreamLayout
              showParticipantCount
              showDuration
              showLiveBadge
              showSpeakerName
            />
          </div>
        </div>
        <LivestreamControls isHost={isHost} onStopLive={onStopLive} />
      </div>
    </div>
  );
};

const LivestreamHeader = () => {
  const { t } = useI18n();
  const { useIsCallLive, useParticipantCount } = useCallStateHooks();
  const isLive = useIsCallLive();
  const participantCount = useParticipantCount();

  return (
    <div className="str-video__embedded-call-header str-video__embedded-livestream-header">
      <div className="str-video__embedded-call-header__title">
        {isLive && (
          <span className="str-video__embedded-badge str-video__embedded-badge--live">
            LIVE
          </span>
        )}
        <span className="str-video__embedded-badge">
          {t('{{ count }} viewers', { count: participantCount })}
        </span>
      </div>
    </div>
  );
};

type LivestreamControlsProps = {
  isHost: boolean;
  onStopLive: () => void;
};

const LivestreamControls = ({
  isHost,
  onStopLive,
}: LivestreamControlsProps) => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group">
        <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
          <ToggleAudioPublishingButton />
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
          <ToggleVideoPublishingButton />
        </Restricted>
      </div>
      {isHost && (
        <div className="str-video__call-controls--group">
          <WithTooltip title={t('End Stream')}>
            <button
              className="str-video__composite-button str-video__composite-button--danger"
              onClick={onStopLive}
            >
              <Icon icon="call-end" />
              <span>{t('End Stream')}</span>
            </button>
          </WithTooltip>
        </div>
      )}
      <div className="str-video__call-controls--group">
        <CancelCallButton />
      </div>
    </div>
  );
};
