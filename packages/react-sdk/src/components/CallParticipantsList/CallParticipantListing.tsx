import clsx from 'clsx';
import {
  ComponentProps,
  ComponentType,
  forwardRef,
  MouseEvent,
  PropsWithChildren,
  useState,
} from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import {
  useActiveCall,
  useCallMetadata,
  useConnectedUser,
  useLocalParticipant,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { Tooltip } from '../Tooltip';
import {
  MenuToggle,
  ToggleMenuButtonProps,
  GenericMenu,
  GenericMenuButtonItem,
} from '../Menu';
import { IconButton, TextButton } from '../Button';
import { HasAccess } from '../Moderation';

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
  DisplayName?: ComponentType<{ participant: StreamVideoParticipant }>;
};

export const CallParticipantListingItem = ({
  participant,
  DisplayName = DefaultDisplayName,
}: CallParticipantListingItemProps) => {
  const localParticipant = useLocalParticipant();

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
        <HasAccess
          participant={localParticipant!}
          // TODO: add 'kick-users' when available
          requires={['block-users', 'mute-users']}
        >
          <MenuToggle placement="bottom-end" ToggleButton={ToggleButton}>
            <Menu participant={participant} />
          </MenuToggle>
        </HasAccess>
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
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const callMetadata = useCallMetadata(activeCall!);
  const localParticipant = useLocalParticipant();

  console.log(localParticipant);

  const getCall = () =>
    client?.coordinatorClient.call(
      activeCall!.data.call.type,
      activeCall!.data.call.id,
    );

  const unblockUserClickHandler = (e: MouseEvent<HTMLButtonElement>) => {
    const user = e.currentTarget.parentElement?.getAttribute('data-user-id');

    if (user) getCall()?.unblockUser(user);
  };

  const muteAllClickHandler = () => {
    getCall()?.muteAllUsers('audio');
  };

  const blockedUsers = callMetadata.blocked_user_ids;

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Subheader>Active users</Subheader>

        <HasAccess participant={localParticipant!} requires={['mute-users']}>
          <TextButton onClick={muteAllClickHandler}>Mute all</TextButton>
        </HasAccess>
      </div>
      <div className="str-video__participant-listing">
        {data.map((participant) => (
          <CallParticipantListingItem
            key={participant.sessionId}
            participant={participant}
          />
        ))}
      </div>
      {!!blockedUsers.length && (
        <>
          <Subheader>Blocked users</Subheader>
          <div className="str-video__participant-listing">
            {blockedUsers.map((userId) => (
              <div
                data-user-id={userId}
                className="str-video__participant-listing-item"
              >
                <div className="str-video__participant-listing-item__display-name">
                  {userId}
                </div>
                <HasAccess
                  participant={localParticipant!}
                  requires={['block-users']}
                >
                  <TextButton onClick={unblockUserClickHandler}>
                    Unblock
                  </TextButton>
                </HasAccess>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);

const Menu = ({ participant }: { participant: StreamVideoParticipant }) => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const localParticipant = useLocalParticipant();

  const getCall = () =>
    client?.coordinatorClient.call(
      activeCall!.data.call.type,
      activeCall!.data.call.id,
    );

  const blockUserClickHandler = () => {
    getCall()?.blockUser(participant.userId);
  };

  const muteUserClickHandler = (e: MouseEvent) => {
    getCall()?.muteUser(
      participant.userId,
      e.currentTarget.getAttribute('data-type') as 'video' | 'audio',
    );
  };

  return (
    <GenericMenu>
      <HasAccess participant={localParticipant!} requires={['block-users']}>
        <GenericMenuButtonItem onClick={blockUserClickHandler}>
          Block
        </GenericMenuButtonItem>
      </HasAccess>
      <GenericMenuButtonItem disabled>Kick</GenericMenuButtonItem>
      <HasAccess participant={localParticipant!} requires={['mute-users']}>
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(SfuModels.TrackType.VIDEO)
          }
          data-type="video"
          onClick={muteUserClickHandler}
        >
          Mute video
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(SfuModels.TrackType.AUDIO)
          }
          data-type="audio"
          onClick={muteUserClickHandler}
        >
          Mute audio
        </GenericMenuButtonItem>
      </HasAccess>
    </GenericMenu>
  );
};

const Subheader = ({ children }: PropsWithChildren) => {
  return (
    <span
      style={{
        fontSize: '0.9rem',
      }}
    >
      {children}
    </span>
  );
};
