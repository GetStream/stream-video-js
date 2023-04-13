import clsx from 'clsx';
import { ComponentProps, ComponentType, forwardRef } from 'react';
import {
  useCall,
  useConnectedUser,
  useOwnCapabilities,
} from '@stream-io/video-react-bindings';
import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { IconButton } from '../Button';
import {
  GenericMenu,
  GenericMenuButtonItem,
  MenuToggle,
  ToggleMenuButtonProps,
} from '../Menu';
import { Restricted } from '../Moderation';
import { WithTooltip } from '../Tooltip';

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
  const ownCapabilities = useOwnCapabilities();

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
        <Restricted
          availableGrants={ownCapabilities}
          // TODO: add 'kick-users' when available
          requiredGrants={[OwnCapability.BLOCK_USERS, OwnCapability.MUTE_USERS]}
        >
          <MenuToggle placement="bottom-end" ToggleButton={ToggleButton}>
            <Menu participant={participant} />
          </MenuToggle>
        </Restricted>
      </div>
    </div>
  );
};

const MediaIndicator = (props: ComponentProps<'div'>) => (
  <WithTooltip {...props} />
);

type DisplayNameProps = {
  /** Participant object that provides the data from which display name can be generated */
  participant: StreamVideoParticipant;
};
// todo: implement display device flag
const DefaultDisplayName = ({ participant }: DisplayNameProps) => {
  const connectedUser = useConnectedUser();

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
    <WithTooltip
      className="str-video__participant-listing-item__display-name"
      title={displayName}
    >
      {displayName}
    </WithTooltip>
  );
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="ellipsis" ref={ref} />;
  },
);
const Menu = ({ participant }: { participant: StreamVideoParticipant }) => {
  const activeCall = useCall();
  const ownCapabilities = useOwnCapabilities();

  const blockUserClickHandler = () => {
    activeCall?.blockUser(participant.userId);
  };

  // FIXME: soft kicking does not work this way
  // also needs to be session-based
  // const kickUserClickHandler = () => {
  //   getCall()?.updateCallMembers({
  //     remove_members: [participant.userId],
  //     disconnectRemovedMembers: true,
  //   });
  // };

  const muteAudioClickHandler = () => {
    activeCall?.muteUser(participant.userId, 'audio');
  };
  const muteVideoClickHandler = () => {
    activeCall?.muteUser(participant.userId, 'video');
  };

  return (
    <GenericMenu>
      <Restricted
        availableGrants={ownCapabilities}
        requiredGrants={[OwnCapability.BLOCK_USERS]}
      >
        <GenericMenuButtonItem onClick={blockUserClickHandler}>
          Block
        </GenericMenuButtonItem>
      </Restricted>
      {/* <GenericMenuButtonItem disabled onClick={kickUserClickHandler}>
        Kick
      </GenericMenuButtonItem> */}
      <Restricted
        availableGrants={ownCapabilities}
        requiredGrants={[OwnCapability.MUTE_USERS]}
      >
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(SfuModels.TrackType.VIDEO)
          }
          onClick={muteVideoClickHandler}
        >
          Mute video
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          disabled={
            !participant.publishedTracks.includes(SfuModels.TrackType.AUDIO)
          }
          onClick={muteAudioClickHandler}
        >
          Mute audio
        </GenericMenuButtonItem>
      </Restricted>
    </GenericMenu>
  );
};
