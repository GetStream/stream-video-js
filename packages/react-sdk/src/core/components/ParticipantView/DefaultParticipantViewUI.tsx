import { forwardRef } from 'react';
import { Placement } from '@floating-ui/react';
import { SfuModels } from '@stream-io/video-client';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import clsx from 'clsx';

import {
  Icon,
  IconButton,
  MenuToggle,
  Notification,
  ParticipantActionsContextMenu,
  ToggleMenuButtonProps,
} from '../../../components';
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
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);

export const DefaultScreenShareOverlay = () => {
  const call = useCall();
  const { t } = useI18n();

  const stopScreenShare = () => {
    call?.screenShare.disable();
  };

  return (
    <div className="str-video__screen-share-overlay">
      <Icon icon="screen-share-off" />
      <span className="str-video__screen-share-overlay__title">
        {t('You are presenting your screen')}
      </span>
      <button
        onClick={stopScreenShare}
        className="str-video__screen-share-overlay__button"
      >
        <Icon icon="close" /> {t('Stop Screen Sharing')}
      </button>
    </div>
  );
};

export const DefaultParticipantViewUI = ({
  indicatorsVisible = true,
  menuPlacement = 'bottom-end',
  showMenuButton = true,
}: DefaultParticipantViewUIProps) => {
  const { participant, participantViewElement, trackType, videoElement } =
    useParticipantViewContext();
  const { publishedTracks } = participant;

  const hasScreenShare = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  if (
    participant.isLocalParticipant &&
    hasScreenShare &&
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
          <ParticipantActionsContextMenu
            participantViewElement={participantViewElement}
            participant={participant}
            videoElement={videoElement}
          />
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
  const { participant } = useParticipantViewContext();
  const {
    isDominantSpeaker,
    isLocalParticipant,
    connectionQuality,
    publishedTracks,
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

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const canUnpin = !!pin && pin.isLocalPin;

  return (
    <div className="str-video__participant-details">
      <span className="str-video__participant-details__name">
        {name || userId}
        {indicatorsVisible && isDominantSpeaker && (
          <span
            className="str-video__participant-details__name--dominant_speaker"
            title={t('Dominant speaker')}
          />
        )}
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
        {indicatorsVisible && !hasAudio && (
          <span className="str-video__participant-details__name--audio-muted" />
        )}
        {indicatorsVisible && !hasVideo && (
          <span className="str-video__participant-details__name--video-muted" />
        )}
        {indicatorsVisible && canUnpin && (
          // TODO: remove this monstrosity once we have a proper design
          <span
            title={t('Unpin')}
            onClick={() => call?.unpin(sessionId)}
            style={{ cursor: 'pointer' }}
            className="str-video__participant-details__name--pinned"
          />
        )}
      </span>
    </div>
  );
};
