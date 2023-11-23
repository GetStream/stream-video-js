import clsx from 'clsx';
import {
  ComponentProps,
  ComponentType,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import {
  Restricted,
  useCall,
  useConnectedUser,
  useI18n,
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
import { WithTooltip } from '../Tooltip';
import { Icon } from '../Icon';
import { Avatar } from '../Avatar';

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
  const isAudioOn = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoOn = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const isPinned = !!participant.pin;

  const { t } = useI18n();

  return (
    <div className="str-video__participant-listing-item">
      <div className="str-video__participant-avatar">
        <Avatar name={participant.name} imageSrc={participant.image} />
        <DisplayName participant={participant} />
      </div>
      <div className="str-video__participant-listing-item__media-indicator-group">
        <MediaIndicator
          title={isAudioOn ? t('Microphone on') : t('Microphone off')}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isAudioOn ? 'mic' : 'mic-off'
            }`,
          )}
        />
        <MediaIndicator
          title={isVideoOn ? t('Camera on') : t('Camera off')}
          className={clsx(
            'str-video__participant-listing-item__icon',
            `str-video__participant-listing-item__icon-${
              isVideoOn ? 'camera' : 'camera-off'
            }`,
          )}
        />
        {isPinned && (
          <MediaIndicator
            title={t('Pinned')}
            className={clsx(
              'str-video__participant-listing-item__icon',
              'str-video__participant-listing-item__icon-pinned',
            )}
          />
        )}

        <MenuToggle placement="bottom-end" ToggleButton={ToggleButton}>
          <ParticipantActionsContextMenu participant={participant} />
        </MenuToggle>
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
  const { t } = useI18n();

  const meFlag = participant.userId === connectedUser?.id ? t('Me') : '';
  const nameOrId = participant.name || participant.userId || t('Unknown');
  let displayName;
  if (!participant.name) {
    displayName = meFlag || nameOrId || t('Unknown');
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

export const ParticipantActionsContextMenu = ({
  participant,
  participantViewElement,
  videoElement,
}: {
  participant: StreamVideoParticipant;
  participantViewElement?: HTMLDivElement | null;
  videoElement?: HTMLVideoElement | null;
}) => {
  const [fullscreenModeOn, setFullscreenModeOn] = useState(
    !!document.fullscreenElement,
  );
  const [pictureInPictureElement, setPictureInPictureElement] = useState(
    document.pictureInPictureElement,
  );
  const call = useCall();
  const { t } = useI18n();

  const { pin, publishedTracks, sessionId, userId } = participant;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const hasScreenShare = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );
  const hasScreenShareAudio = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE_AUDIO,
  );

  const blockUser = () => call?.blockUser(userId);
  const muteAudio = () => call?.muteUser(userId, 'audio');
  const muteVideo = () => call?.muteUser(userId, 'video');
  const muteScreenShare = () => call?.muteUser(userId, 'screenshare');
  const muteScreenShareAudio = () =>
    call?.muteUser(userId, 'screenshare_audio');

  const grantPermission = (permission: string) => () => {
    call?.updateUserPermissions({
      user_id: userId,
      grant_permissions: [permission],
    });
  };

  const revokePermission = (permission: string) => () => {
    call?.updateUserPermissions({
      user_id: userId,
      revoke_permissions: [permission],
    });
  };

  const toggleParticipantPinnedAt = () => {
    if (pin) {
      call?.unpin(sessionId);
    } else {
      call?.pin(sessionId);
    }
  };

  const pinForEveryone = () => {
    call
      ?.pinForEveryone({
        user_id: userId,
        session_id: sessionId,
      })
      .catch((err) => {
        console.error(`Failed to pin participant ${userId}`, err);
      });
  };

  const unpinForEveryone = () => {
    call
      ?.unpinForEveryone({
        user_id: userId,
        session_id: sessionId,
      })
      .catch((err) => {
        console.error(`Failed to unpin participant ${userId}`, err);
      });
  };

  const toggleFullscreenMode = () => {
    if (!fullscreenModeOn) {
      return participantViewElement
        ?.requestFullscreen()
        .then(() => setFullscreenModeOn(true))
        .catch(console.error);
    }

    document
      .exitFullscreen()
      .catch(console.error)
      .finally(() => setFullscreenModeOn(false));
  };

  useEffect(() => {
    if (!videoElement) return;

    const handlePictureInPicture = () => {
      setPictureInPictureElement(document.pictureInPictureElement);
    };

    videoElement.addEventListener(
      'enterpictureinpicture',
      handlePictureInPicture,
    );
    videoElement.addEventListener(
      'leavepictureinpicture',
      handlePictureInPicture,
    );

    return () => {
      videoElement.removeEventListener(
        'enterpictureinpicture',
        handlePictureInPicture,
      );
      videoElement.removeEventListener(
        'leavepictureinpicture',
        handlePictureInPicture,
      );
    };
  }, [videoElement]);

  const togglePictureInPicture = () => {
    if (videoElement && pictureInPictureElement !== videoElement) {
      return videoElement
        .requestPictureInPicture()
        .catch(console.error) as Promise<void>;
    }

    document.exitPictureInPicture().catch(console.error);
  };

  return (
    <GenericMenu>
      <GenericMenuButtonItem
        onClick={toggleParticipantPinnedAt}
        disabled={pin && !pin.isLocalPin}
      >
        <Icon icon="pin" />
        {pin ? t('Unpin') : t('Pin')}
      </GenericMenuButtonItem>
      <Restricted requiredGrants={[OwnCapability.PIN_FOR_EVERYONE]}>
        <GenericMenuButtonItem
          onClick={pinForEveryone}
          disabled={pin && !pin.isLocalPin}
        >
          <Icon icon="pin" />
          {t('Pin for everyone')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={unpinForEveryone}
          disabled={!pin || pin.isLocalPin}
        >
          <Icon icon="pin" />
          {t('Unpin for everyone')}
        </GenericMenuButtonItem>
      </Restricted>
      <Restricted requiredGrants={[OwnCapability.BLOCK_USERS]}>
        <GenericMenuButtonItem onClick={blockUser}>
          <Icon icon="not-allowed" />
          {t('Block')}
        </GenericMenuButtonItem>
      </Restricted>
      <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
        <GenericMenuButtonItem disabled={!hasVideo} onClick={muteVideo}>
          <Icon icon="camera-off-outline" />
          {t('Turn off video')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          disabled={!hasScreenShare}
          onClick={muteScreenShare}
        >
          <Icon icon="screen-share-off" />
          {t('Turn off screen share')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem disabled={!hasAudio} onClick={muteAudio}>
          <Icon icon="no-audio" />
          {t('Mute audio')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          disabled={!hasScreenShareAudio}
          onClick={muteScreenShareAudio}
        >
          <Icon icon="no-audio" />
          {t('Mute screen share audio')}
        </GenericMenuButtonItem>
      </Restricted>
      {participantViewElement && (
        <GenericMenuButtonItem onClick={toggleFullscreenMode}>
          {t('{{ direction }} fullscreen', {
            direction: fullscreenModeOn ? t('Leave') : t('Enter'),
          })}
        </GenericMenuButtonItem>
      )}
      {videoElement && document.pictureInPictureEnabled && (
        <GenericMenuButtonItem onClick={togglePictureInPicture}>
          {t('{{ direction }} picture-in-picture', {
            direction:
              pictureInPictureElement === videoElement
                ? t('Leave')
                : t('Enter'),
          })}
        </GenericMenuButtonItem>
      )}
      <Restricted requiredGrants={[OwnCapability.UPDATE_CALL_PERMISSIONS]}>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SEND_AUDIO)}
        >
          {t('Allow audio')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SEND_VIDEO)}
        >
          {t('Allow video')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SCREENSHARE)}
        >
          {t('Allow screen sharing')}
        </GenericMenuButtonItem>

        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SEND_AUDIO)}
        >
          {t('Disable audio')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SEND_VIDEO)}
        >
          {t('Disable video')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SCREENSHARE)}
        >
          {t('Disable screen sharing')}
        </GenericMenuButtonItem>
      </Restricted>
    </GenericMenu>
  );
};
