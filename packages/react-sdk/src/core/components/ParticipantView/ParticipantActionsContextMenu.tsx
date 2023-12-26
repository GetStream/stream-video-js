import { useEffect, useState } from 'react';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';
import { OwnCapability, SfuModels } from '@stream-io/video-client';
import { useParticipantViewContext } from './ParticipantViewContext';
import { GenericMenu, GenericMenuButtonItem, Icon } from '../../../components';

export const ParticipantActionsContextMenu = () => {
  const { participant, participantViewElement, videoElement } =
    useParticipantViewContext();
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

  const toggleParticipantPin = () => {
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

    return document
      .exitFullscreen()
      .catch(console.error)
      .finally(() => setFullscreenModeOn(false));
  };

  useEffect(() => {
    if (!videoElement) return;

    const handlePiP = () => {
      setPictureInPictureElement(document.pictureInPictureElement);
    };

    videoElement.addEventListener('enterpictureinpicture', handlePiP);
    videoElement.addEventListener('leavepictureinpicture', handlePiP);

    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handlePiP);
      videoElement.removeEventListener('leavepictureinpicture', handlePiP);
    };
  }, [videoElement]);

  const togglePictureInPicture = () => {
    if (videoElement && pictureInPictureElement !== videoElement) {
      return videoElement
        .requestPictureInPicture()
        .catch(console.error) as Promise<void>;
    }

    return document.exitPictureInPicture().catch(console.error);
  };

  return (
    <GenericMenu>
      <GenericMenuButtonItem
        onClick={toggleParticipantPin}
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
