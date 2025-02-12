import { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  DefaultParticipantViewUI,
  GenericMenu,
  GenericMenuButtonItem,
  hasAudio,
  hasScreenShare,
  hasScreenShareAudio,
  hasVideo,
  Icon,
  OwnCapability,
  ParticipantActionsContextMenu,
  Restricted,
  useCall,
  useI18n,
  useMenuContext,
  useParticipantViewContext,
} from '@stream-io/video-react-sdk';
import { DebugStatsView } from './DebugStatsView';
import { useIsDebugMode } from './useIsDebugMode';
import { useIsDemoEnvironment } from '../../context/AppEnvironmentContext';

export const DebugParticipantViewUI = () => {
  const call = useCall();
  const {
    participant: { sessionId, userId },
  } = useParticipantViewContext();

  const isDemoEnvironment = useIsDemoEnvironment();
  const participantContextMenuActions = isDemoEnvironment
    ? CustomParticipantActionsContextMenu
    : ParticipantActionsContextMenu;

  const isDebug = useIsDebugMode();
  if (!isDebug) {
    return (
      <div
        className={clsx(
          'rd__debug__participant-view',
          isDemoEnvironment && 'rd__debug__participant-view--hide-elements',
        )}
      >
        <DefaultParticipantViewUI
          ParticipantActionsContextMenu={participantContextMenuActions}
        />
      </div>
    );
  }
  return (
    <>
      <DefaultParticipantViewUI
        ParticipantActionsContextMenu={participantContextMenuActions}
      />
      <div className="rd__debug__extra">
        <DebugStatsView call={call!} sessionId={sessionId} userId={userId} />
      </div>
    </>
  );
};

const CustomParticipantActionsContextMenu = () => {
  const call = useCall();
  const { t } = useI18n();

  const { participant, participantViewElement, videoElement } =
    useParticipantViewContext();
  const { pin, sessionId, userId } = participant;

  const hasAudioTrack = hasAudio(participant);
  const hasVideoTrack = hasVideo(participant);
  const hasScreenShareTrack = hasScreenShare(participant);
  const hasScreenShareAudioTrack = hasScreenShareAudio(participant);

  const [fullscreenModeOn, setFullscreenModeOn] = useState(
    !!document.fullscreenElement,
  );
  const [pictureInPictureElement, setPictureInPictureElement] = useState(
    document.pictureInPictureElement,
  );

  const blockUser = () => call?.blockUser(userId);
  const muteAudio = () => call?.muteUser(userId, 'audio');
  const muteVideo = () => call?.muteUser(userId, 'video');
  const muteScreenShare = () => call?.muteUser(userId, 'screenshare');
  const muteScreenShareAudio = () =>
    call?.muteUser(userId, 'screenshare_audio');

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

  const { close } = useMenuContext() || {};
  return (
    <GenericMenu onItemClick={close}>
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
        {hasVideoTrack && (
          <GenericMenuButtonItem onClick={muteVideo}>
            <Icon icon="camera-off-outline" />
            {t('Turn off video')}
          </GenericMenuButtonItem>
        )}
        {hasScreenShareTrack && (
          <GenericMenuButtonItem onClick={muteScreenShare}>
            <Icon icon="screen-share-off" />
            {t('Turn off screen share')}
          </GenericMenuButtonItem>
        )}
        {hasAudioTrack && (
          <GenericMenuButtonItem onClick={muteAudio}>
            <Icon icon="no-audio" />
            {t('Mute audio')}
          </GenericMenuButtonItem>
        )}
        {hasScreenShareAudioTrack && (
          <GenericMenuButtonItem onClick={muteScreenShareAudio}>
            <Icon icon="no-audio" />
            {t('Mute screen share audio')}
          </GenericMenuButtonItem>
        )}
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
    </GenericMenu>
  );
};
