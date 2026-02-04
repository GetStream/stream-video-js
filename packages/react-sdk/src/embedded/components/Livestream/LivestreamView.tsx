import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { LivestreamLayout } from '../../../core';
import {
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
  const isHost = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

  return (
    <div className="str-video__embedded-call str-video__embedded-livestream">
      <div className="str-video__embedded-main-panel">
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
        {isHost && <LivestreamControls onStopLive={onStopLive} />}
      </div>
    </div>
  );
};

const LivestreamControls = ({ onStopLive }: { onStopLive: () => void }) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group str-video__call-controls--media">
        <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
          <ToggleAudioPublishingButton />
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
          <ToggleVideoPublishingButton />
        </Restricted>
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
    </div>
  );
};
