import { useEffect, useState } from 'react';
import { Restricted, useCall } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
import {
  hasAudio,
  hasScreenShare,
  hasScreenShareAudio,
  hasVideo,
  OwnCapability,
  UpdateUserPermissionsRequestGrantPermissionsEnum,
  UpdateUserPermissionsRequestRevokePermissionsEnum,
} from '@stream-io/video-client';
import { useParticipantViewContext } from './ParticipantViewContext';
import {
  GenericMenu,
  GenericMenuButtonItem,
  GenericMenuSeparator,
  useMenuContext,
} from '../../../components/Menu';
import { Icon } from '../../../components/Icon';
import { usePictureInPictureState } from '../../hooks/usePictureInPictureState';

export const ParticipantActionsContextMenu = () => {
  const { participant, participantViewElement, videoElement } =
    useParticipantViewContext();
  const [fullscreenModeOn, setFullscreenModeOn] = useState(
    !!document.fullscreenElement,
  );
  const call = useCall();
  const isPiP = usePictureInPictureState(videoElement ?? undefined);
  const { t } = useI18n();

  const { pin, sessionId, userId } = participant;

  const hasAudioTrack = hasAudio(participant);
  const hasVideoTrack = hasVideo(participant);
  const hasScreenShareTrack = hasScreenShare(participant);
  const hasScreenShareAudioTrack = hasScreenShareAudio(participant);

  const blockUser = () => call?.blockUser(userId);
  const kickUser = () => call?.kickUser({ user_id: userId });
  const muteAudio = () => call?.muteUser(userId, 'audio');
  const muteVideo = () => call?.muteUser(userId, 'video');
  const muteScreenShare = () => call?.muteUser(userId, 'screenshare');
  const muteScreenShareAudio = () =>
    call?.muteUser(userId, 'screenshare_audio');

  const grantPermission =
    (permission: UpdateUserPermissionsRequestGrantPermissionsEnum) => () => {
      call?.updateUserPermissions({
        user_id: userId,
        grant_permissions: [permission],
      });
    };

  const revokePermission =
    (permission: UpdateUserPermissionsRequestRevokePermissionsEnum) => () => {
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
      ?.pinForEveryone({ user_id: userId, session_id: sessionId })
      .catch((err) => {
        console.error(`Failed to pin participant ${userId}`, err);
      });
  };

  const unpinForEveryone = () => {
    call
      ?.unpinForEveryone({ user_id: userId, session_id: sessionId })
      .catch((err) => {
        console.error(`Failed to unpin participant ${userId}`, err);
      });
  };

  const toggleFullscreenMode = () => {
    if (!fullscreenModeOn) {
      return participantViewElement?.requestFullscreen().catch(console.error);
    }
    return document.exitFullscreen().catch(console.error);
  };

  useEffect(() => {
    // handles the case when fullscreen mode is toggled externally,
    // e.g., by pressing ESC key or some other keyboard shortcut
    const handleFullscreenChange = () => {
      setFullscreenModeOn(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePictureInPicture = () => {
    if (videoElement && !isPiP) {
      return videoElement
        .requestPictureInPicture()
        .catch(console.error) as Promise<void>;
    }

    return document.exitPictureInPicture().catch(console.error);
  };

  const { close } = useMenuContext() || {};
  return (
    <GenericMenu onItemClick={close}>
      <GenericMenuButtonItem
        onClick={toggleParticipantPin}
        disabled={pin && !pin.isLocalPin}
      >
        <Icon icon="pin" />
        {pin
          ? t('participantView.unpin.label', 'Unpin')
          : t('participantView.actionsMenu.pin.label', 'Pin')}
      </GenericMenuButtonItem>
      <Restricted requiredGrants={[OwnCapability.PIN_FOR_EVERYONE]}>
        <GenericMenuButtonItem
          onClick={pinForEveryone}
          disabled={pin && !pin.isLocalPin}
        >
          <Icon icon="pin" />
          {t(
            'participantView.actionsMenu.pinForEveryone.label',
            'Pin for everyone',
          )}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={unpinForEveryone}
          disabled={!pin || pin.isLocalPin}
        >
          <Icon icon="pin" />
          {t(
            'participantView.actionsMenu.unpinForEveryone.label',
            'Unpin for everyone',
          )}
        </GenericMenuButtonItem>
      </Restricted>
      <Restricted requiredGrants={[OwnCapability.BLOCK_USERS]}>
        <GenericMenuButtonItem onClick={blockUser}>
          <Icon icon="not-allowed" />
          {t('participantView.actionsMenu.block.label', 'Block')}
        </GenericMenuButtonItem>
      </Restricted>
      <Restricted requiredGrants={[OwnCapability.KICK_USER]}>
        <GenericMenuButtonItem onClick={kickUser}>
          <Icon icon="kick-user" />
          {t('participantView.actionsMenu.kick.label', 'Kick')}
        </GenericMenuButtonItem>
      </Restricted>
      <GenericMenuSeparator />
      <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
        {hasVideoTrack && (
          <GenericMenuButtonItem onClick={muteVideo}>
            <Icon icon="camera-off-outline" />
            {t(
              'participantView.actionsMenu.turnOffVideo.label',
              'Turn off video',
            )}
          </GenericMenuButtonItem>
        )}
        {hasScreenShareTrack && (
          <GenericMenuButtonItem onClick={muteScreenShare}>
            <Icon icon="screen-share-off" />
            {t(
              'participantView.actionsMenu.turnOffScreenShare.label',
              'Turn off screen share',
            )}
          </GenericMenuButtonItem>
        )}
        {hasAudioTrack && (
          <GenericMenuButtonItem onClick={muteAudio}>
            <Icon icon="no-audio" />
            {t('participantView.actionsMenu.muteAudio.label', 'Mute audio')}
          </GenericMenuButtonItem>
        )}
        {hasScreenShareAudioTrack && (
          <GenericMenuButtonItem onClick={muteScreenShareAudio}>
            <Icon icon="no-audio" />
            {t(
              'participantView.actionsMenu.muteScreenShareAudio.label',
              'Mute screen share audio',
            )}
          </GenericMenuButtonItem>
        )}
      </Restricted>
      {participantViewElement &&
        typeof participantViewElement.requestFullscreen !== 'undefined' && (
          <GenericMenuButtonItem onClick={toggleFullscreenMode}>
            <Icon icon="fullscreen" />
            {fullscreenModeOn
              ? t(
                  'participantView.actionsMenu.leaveFullscreen.label',
                  'Leave fullscreen',
                )
              : t(
                  'participantView.actionsMenu.enterFullscreen.label',
                  'Enter fullscreen',
                )}
          </GenericMenuButtonItem>
        )}
      {videoElement && document.pictureInPictureEnabled && (
        <GenericMenuButtonItem onClick={togglePictureInPicture}>
          <Icon icon="pip" />
          {isPiP
            ? t(
                'participantView.actionsMenu.leavePip.label',
                'Leave picture-in-picture',
              )
            : t(
                'participantView.actionsMenu.enterPip.label',
                'Enter picture-in-picture',
              )}
        </GenericMenuButtonItem>
      )}
      <GenericMenuSeparator />
      <Restricted requiredGrants={[OwnCapability.UPDATE_CALL_PERMISSIONS]}>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SEND_AUDIO)}
        >
          {t('participantView.actionsMenu.allowAudio.label', 'Allow audio')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SEND_VIDEO)}
        >
          {t('participantView.actionsMenu.allowVideo.label', 'Allow video')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={grantPermission(OwnCapability.SCREENSHARE)}
        >
          {t(
            'participantView.actionsMenu.allowScreenSharing.label',
            'Allow screen sharing',
          )}
        </GenericMenuButtonItem>

        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SEND_AUDIO)}
        >
          {t('participantView.actionsMenu.disableAudio.label', 'Disable audio')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SEND_VIDEO)}
        >
          {t('participantView.actionsMenu.disableVideo.label', 'Disable video')}
        </GenericMenuButtonItem>
        <GenericMenuButtonItem
          onClick={revokePermission(OwnCapability.SCREENSHARE)}
        >
          {t(
            'participantView.actionsMenu.disableScreenSharing.label',
            'Disable screen sharing',
          )}
        </GenericMenuButtonItem>
      </Restricted>
    </GenericMenu>
  );
};
