import {
  CallingState,
  OwnCapability,
  Restricted,
  SfuModels,
  StreamCallEvent,
  useCall,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-sdk';
import { useCallback, useEffect, useState } from 'react';
import {
  BellIcon,
  LoadingIcon,
  MicrophoneIcon,
  MuteMicrophoneIcon,
  RaiseHandIcon,
} from '../icons';
import type { CustomCallData } from '../../types';

type LiveRoomControlsProps = {
  hasNotifications: boolean;
  openRequestsList: () => void;
};
export const LiveRoomControls = ({
  hasNotifications,
  openRequestsList,
}: LiveRoomControlsProps) => {
  const call = useCall();
  const {
    useCallCustomData,
    useCallCallingState,
    useLocalParticipant,
    useHasPermissions,
  } = useCallStateHooks();
  const customData = useCallCustomData();
  const callingState = useCallCallingState();
  const connectedUser = useConnectedUser();
  const localParticipant = useLocalParticipant();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
  const canRequestSpeakingPermissions = call?.permissionsContext.canRequest(
    OwnCapability.SEND_AUDIO,
  );
  const [isAwaitingAudioApproval, setIsAwaitingAudioApproval] = useState(false);

  const isSpeaker = (customData as CustomCallData).speakerIds?.some(
    (id) => id === connectedUser?.id,
  );
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const toggleAudio = useCallback(async () => {
    if (!call) return;

    if (!canSendAudio) {
      setIsAwaitingAudioApproval(true);
      await call
        .requestPermissions({
          permissions: [OwnCapability.SEND_AUDIO],
        })
        .catch((reason) => {
          console.log('RequestPermissions failed', reason);
        });
    } else {
      await call.microphone.toggle().catch((err) => {
        console.log('toggleAudio failed', err);
      });
    }
  }, [call, canSendAudio]);

  useEffect(() => {
    if (!(call && connectedUser)) return;
    return call.on('call.permissions_updated', (event: StreamCallEvent) => {
      if (event.type !== 'call.permissions_updated') return;
      if (connectedUser.id !== event.user.id) return;
      if (event.own_capabilities.includes(OwnCapability.SEND_AUDIO)) {
        call.microphone.enable().catch((err) => {
          console.log('enable microphone failed', err);
        });
      } else {
        call.microphone.disable().catch((err) => {
          console.log('disable microphone failed', err);
        });
      }
    });
  }, [call, connectedUser]);

  useEffect(() => {
    if (canSendAudio) {
      setIsAwaitingAudioApproval(false);
    }
  }, [canSendAudio]);

  useEffect(() => {
    if (callingState !== CallingState.LEFT) {
      setIsAwaitingAudioApproval(false);
    }
  }, [callingState]);

  if (!call || callingState !== CallingState.JOINED) return null;

  const showMuteButton =
    canSendAudio || (canRequestSpeakingPermissions && isSpeaker);

  return (
    <div className="live-room-controls">
      <Restricted requiredGrants={[OwnCapability.UPDATE_CALL_PERMISSIONS]}>
        <button
          className={`icon-button ${hasNotifications ? 'notifications' : ''}`}
          onClick={openRequestsList}
          title="Requests"
        >
          <BellIcon />
        </button>
      </Restricted>
      {showMuteButton && (
        <button
          className="icon-button"
          disabled={isAwaitingAudioApproval}
          onClick={toggleAudio}
          title={isAudioMute ? 'Unmute' : 'Mute'}
        >
          {isAwaitingAudioApproval ? (
            <LoadingIcon />
          ) : isAudioMute ? (
            <MuteMicrophoneIcon />
          ) : (
            <MicrophoneIcon />
          )}
        </button>
      )}
      {!showMuteButton && (
        <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]} canRequestOnly>
          <button
            className="icon-button"
            disabled={isAwaitingAudioApproval}
            title="Request to speak"
            onClick={() => {
              setIsAwaitingAudioApproval(true);
              call.requestPermissions({
                permissions: [OwnCapability.SEND_AUDIO],
              });
            }}
          >
            <RaiseHandIcon />
          </button>
        </Restricted>
      )}
      {isAwaitingAudioApproval && (
        <div className="live-room-controls__notificaton">
          Waiting for permission to speak
        </div>
      )}
    </div>
  );
};
