import clsx from 'clsx';
import { ComponentProps, useState } from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useConnectedUser } from '@stream-io/video-react-bindings';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { Tooltip } from '../Tooltip';

const MediaIndicator = ({ title, ...props }: ComponentProps<'div'>) => {
  const { handleMouseEnter, handleMouseLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <>
      <Tooltip referenceElement={tooltipAnchor} visible={tooltipVisible}>
        {title || ''}
      </Tooltip>
      <div
        ref={setTooltipAnchor}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </>
  );
};

type DisplayNameProps = {
  /** Participant object that provides the data from which display name can be generated */
  participant: StreamVideoParticipant;
};

// todo: implement display device flag
const DefaultDisplayName = ({ participant }: DisplayNameProps) => {
  const connectedUser = useConnectedUser();
  const { handleMouseEnter, handleMouseLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLDivElement | null>(
    null,
  );

  const meFlag = participant.userId === connectedUser?.id ? 'Me' : '';
  const nameOrId = participant.name || participant.userId || 'Unknown';
  let displayName;
  if (!participant.name) {
    displayName = meFlag || nameOrId || 'Unknown';
  } else if (meFlag) {
    displayName = `${nameOrId} (${meFlag})`;
  } else {
    displayName = nameOrId;
  }

  return (
    <div
      ref={setTooltipAnchor}
      className="str-video__participant-listing-item__display-name"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Tooltip
        offset={[20, 10]}
        referenceElement={tooltipAnchor}
        visible={tooltipVisible}
      >
        {displayName}
      </Tooltip>
      {displayName}
    </div>
  );
};

type CallParticipantListingItemProps = {
  /** Participant object be rendered */
  participant: StreamVideoParticipant;
  /** Custom component used to display participant's name */
  DisplayName?: React.ComponentType<{ participant: StreamVideoParticipant }>;
};
export const CallParticipantListingItem = ({
  participant,
  DisplayName = DefaultDisplayName,
}: CallParticipantListingItemProps) => {
  const isAudioOn = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoOn = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  return (
    <div className="str-video__participant-listing-item">
      <DisplayName participant={participant} />
      <div className="str-video__participant-listing-item__media-indicator-group">
        <MediaIndicator
          title={isAudioOn ? 'Microphone on' : 'Microphone off'}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isAudioOn ? 'mic' : 'mic-off'
            }`,
          )}
        />
        <MediaIndicator
          title={isVideoOn ? 'Camera on' : 'Camera off'}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isVideoOn ? 'camera' : 'camera-off'
            }`,
          )}
        />
      </div>
    </div>
  );
};

export type CallParticipantListingProps = {
  /** Array of participant objects to be rendered */
  data: StreamVideoParticipant[];
};
export const CallParticipantListing = ({
  data,
}: CallParticipantListingProps) => {
  return (
    <div className="str-video__participant-listing">
      {data.map((participant) => (
        <CallParticipantListingItem
          key={participant.sessionId}
          participant={participant}
        />
      ))}
    </div>
  );
};
