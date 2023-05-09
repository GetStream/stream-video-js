import { forwardRef } from 'react';
import { Placement } from '@floating-ui/react';
import { SfuModels } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import { clsx } from 'clsx';

import {
  IconButton,
  MenuToggle,
  Notification,
  ParticipantActionsContextMenu,
  ToggleMenuButtonProps,
} from '../../../components';
import { Reaction } from '../../../components/Reaction';
import { ParticipantViewProps } from './ParticipantView';

import { DebugParticipantPublishQuality } from '../../../components/Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../../../components/Debug/DebugStatsView';
import { useIsDebugMode } from '../../../components/Debug/useIsDebugMode';

export type ParticipantViewUIProps = Pick<ParticipantViewProps, 'participant'>;

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
} & Pick<ParticipantViewProps, 'participant'>;

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);

export const DefaultParticipantViewUI = ({
  participant,
  indicatorsVisible = true,
  menuPlacement = 'bottom-end',
  showMenuButton = true,
}: DefaultParticipantViewUIProps) => {
  const call = useCall()!;
  const { reaction, sessionId } = participant;

  return (
    <>
      {showMenuButton && (
        <MenuToggle
          strategy="fixed"
          placement={menuPlacement}
          ToggleButton={ToggleButton}
        >
          <ParticipantActionsContextMenu participant={participant} />
        </MenuToggle>
      )}
      {reaction && (
        <Reaction reaction={reaction} sessionId={sessionId} call={call} />
      )}
      <ParticipantDetails
        participant={participant}
        indicatorsVisible={indicatorsVisible}
      />
    </>
  );
};

export const ParticipantDetails = ({
  participant,
  indicatorsVisible = true,
}: Pick<
  DefaultParticipantViewUIProps,
  'participant' | 'indicatorsVisible'
>) => {
  const {
    isDominantSpeaker,
    isLoggedInUser,
    connectionQuality,
    publishedTracks,
    pinnedAt,
    sessionId,
    name,
    userId,
    videoStream,
  } = participant;
  const call = useCall()!;

  const connectionQualityAsString =
    !!connectionQuality &&
    String(SfuModels.ConnectionQuality[connectionQuality]).toLowerCase();

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const isPinned = !!pinnedAt;

  const isDebugMode = useIsDebugMode();

  return (
    <div className="str-video__participant-details">
      <span className="str-video__participant-details__name">
        {name || userId}
        {indicatorsVisible && isDominantSpeaker && (
          <span
            className="str-video__participant-details__name--dominant_speaker"
            title="Dominant speaker"
          />
        )}
        {indicatorsVisible && (
          <Notification
            isVisible={
              isLoggedInUser &&
              connectionQuality === SfuModels.ConnectionQuality.POOR
            }
            message="Poor connection quality. Please check your internet connection."
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
        {indicatorsVisible && isPinned && (
          // TODO: remove this monstrosity once we have a proper design
          <span
            title="Unpin"
            onClick={() => call?.setParticipantPinnedAt(sessionId)}
            style={{ cursor: 'pointer' }}
            className="str-video__participant-details__name--pinned"
          />
        )}
      </span>
      {isDebugMode && (
        <>
          <DebugParticipantPublishQuality
            participant={participant}
            call={call}
          />
          <DebugStatsView
            call={call}
            kind={isLoggedInUser ? 'publisher' : 'subscriber'}
            mediaStream={videoStream}
          />
        </>
      )}
    </div>
  );
};
