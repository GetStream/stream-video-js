import { ComponentType, forwardRef } from 'react';
import { Placement } from '@floating-ui/react';
import {
  hasAudio,
  hasPausedTrack,
  hasScreenShare,
  hasVideo,
  SfuModels,
} from '@stream-io/video-client';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import clsx from 'clsx';

import {
  Icon,
  IconButton,
  MenuToggle,
  Notification,
  ToggleMenuButtonProps,
} from '../../../components';
import { ParticipantActionsContextMenu as DefaultParticipantActionsContextMenu } from './ParticipantActionsContextMenu';
import { Reaction } from '../../../components/Reaction';
import { useParticipantViewContext } from './ParticipantViewContext';

export type DefaultParticipantViewUIProps = {
  /**
   * Turns on/off the status indicator icons (mute, connection quality, etc...).
   */
  indicatorsVisible?: boolean;
  /**
   * Placement of the context menu component when opened
   */
  menuPlacement?: Placement;
  /**
   * Option to show/hide menu button component
   */
  showMenuButton?: boolean;
  /**
   * Custom component to render the context menu
   */
  ParticipantActionsContextMenu?: ComponentType;
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleButton(props, ref) {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);

export const DefaultScreenShareOverlay = () => {
  const call = useCall();
  const { t } = useI18n();

  const stopScreenShare = () => {
    call?.screenShare.disable().catch((err) => {
      console.error('Failed to stop screen sharing:', err);
    });
  };

  return (
    <div className="str-video__screen-share-overlay">
      <Icon icon="screen-share-off" />
      <span className="str-video__screen-share-overlay__title">
        {t('You are presenting your screen')}
      </span>
      <button
        onClick={stopScreenShare}
        type="button"
        className="str-video__screen-share-overlay__button"
      >
        <Icon icon="close" /> {t('Stop Screen Sharing')}
      </button>
    </div>
  );
};

export const DefaultParticipantViewUI = ({
  indicatorsVisible = true,
  menuPlacement = 'bottom-start',
  showMenuButton = true,
  ParticipantActionsContextMenu = DefaultParticipantActionsContextMenu,
}: DefaultParticipantViewUIProps) => {
  const { participant, trackType } = useParticipantViewContext();
  const isScreenSharing = hasScreenShare(participant);

  if (
    participant.isLocalParticipant &&
    isScreenSharing &&
    trackType === 'screenShareTrack'
  ) {
    return (
      <>
        <DefaultScreenShareOverlay />
        <ParticipantDetails indicatorsVisible={indicatorsVisible} />
      </>
    );
  }

  return (
    <>
      {showMenuButton && (
        <MenuToggle
          strategy="fixed"
          placement={menuPlacement}
          ToggleButton={ToggleButton}
        >
          <ParticipantActionsContextMenu />
        </MenuToggle>
      )}
      <Reaction participant={participant} />
      <ParticipantDetails indicatorsVisible={indicatorsVisible} />
    </>
  );
};

export const ParticipantDetails = ({
  indicatorsVisible = true,
}: Pick<DefaultParticipantViewUIProps, 'indicatorsVisible'>) => {
  const { participant, trackType } = useParticipantViewContext();
  const {
    isLocalParticipant,
    connectionQuality,
    pin,
    sessionId,
    name,
    userId,
  } = participant;
  const call = useCall();

  const { t } = useI18n();
  const connectionQualityAsString =
    !!connectionQuality &&
    SfuModels.ConnectionQuality[connectionQuality].toLowerCase();

  const hasAudioTrack = hasAudio(participant);
  const hasVideoTrack = hasVideo(participant);
  const canUnpin = !!pin && pin.isLocalPin;
  const isTrackPaused =
    trackType !== 'none' ? hasPausedTrack(participant, trackType) : false;

  return (
    <>
      <div className="str-video__participant-details">
        <span className="str-video__participant-details__name">
          {name || userId}

          {indicatorsVisible && !hasAudioTrack && (
            <span className="str-video__participant-details__name--audio-muted" />
          )}
          {indicatorsVisible && !hasVideoTrack && (
            <span className="str-video__participant-details__name--video-muted" />
          )}
          {indicatorsVisible && isTrackPaused && (
            <span
              title={t('Video paused due to insufficient bandwidth')}
              className="str-video__participant-details__name--track-paused"
            />
          )}
          {indicatorsVisible && canUnpin && (
            // TODO: remove this monstrosity once we have a proper design
            <span
              title={t('Unpin')}
              onClick={() => call?.unpin(sessionId)}
              className="str-video__participant-details__name--pinned"
            />
          )}
          {indicatorsVisible && <SpeechIndicator />}
        </span>
      </div>
      {indicatorsVisible && (
        <Notification
          isVisible={
            isLocalParticipant &&
            connectionQuality === SfuModels.ConnectionQuality.POOR
          }
          message={t('Poor connection quality')}
        >
          {connectionQualityAsString && (
            <span
              className={clsx(
                'str-video__participant-details__connection-quality',
                `str-video__participant-details__connection-quality--${connectionQualityAsString}`,
              )}
              title={connectionQualityAsString}
            />
          )}
        </Notification>
      )}
    </>
  );
};

export const SpeechIndicator = () => {
  const { participant } = useParticipantViewContext();
  const { isSpeaking, isDominantSpeaker } = participant;
  return (
    <span
      className={clsx(
        'str-video__speech-indicator',
        isSpeaking && 'str-video__speech-indicator--speaking',
        isDominantSpeaker && 'str-video__speech-indicator--dominant',
      )}
    >
      <span className="str-video__speech-indicator__bar" />
      <span className="str-video__speech-indicator__bar" />
      <span className="str-video__speech-indicator__bar" />
    </span>
  );
};
