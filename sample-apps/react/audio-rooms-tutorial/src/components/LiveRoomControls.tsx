import {
  CallingState,
  OwnCapability,
  Restricted,
  SfuModels,
  StreamCallEvent,
  useCall,
  useCallCallingState,
  useCallMetadata,
  useConnectedUser,
  useHasPermissions,
  useLocalParticipant,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { useCallback, useEffect, useState } from 'react';
import {
  BellIcon,
  LoadingIcon,
  MicrophoneIcon,
  MuteMicrophoneIcon,
  RaiseHandIcon,
} from './icons';
import type { CustomCallData } from '../types';

type OpenNotificationsButtonProps = {
  hasNotifications: boolean;
  openRequestsList: () => void;
};

type LiveRoomControlsProps = OpenNotificationsButtonProps;
export const LiveRoomControls = ({
  hasNotifications,
  openRequestsList,
}: LiveRoomControlsProps) => {
  const call = useCall();
  const callMetadata = useCallMetadata();
  const callingState = useCallCallingState();
  const connectedUser = useConnectedUser();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
  const canRequestSpeakingPermissions = call?.permissionsContext.canRequest(
    OwnCapability.SEND_AUDIO,
  );
  const { publishAudioStream, stopPublishingAudio, setInitialAudioEnabled } =
    useMediaDevices();

  const [isAwaitingAudioApproval, setIsAwaitingAudioApproval] = useState(false);

  const isSpeaker = (callMetadata?.custom as CustomCallData).speakerIds?.some(
    (id) => id === connectedUser?.id,
  );

  useEffect(() => {
    if (!(call && connectedUser)) return;
    return call.on('call.permissions_updated', (event: StreamCallEvent) => {
      if (event.type !== 'call.permissions_updated') return;
      if (connectedUser.id !== event.user.id) return;
      if (event.own_capabilities.includes(OwnCapability.SEND_AUDIO)) {
        setInitialAudioEnabled(true);
        publishAudioStream();
      } else {
        stopPublishingAudio();
      }
    });
  }, [
    call,
    connectedUser,
    publishAudioStream,
    setInitialAudioEnabled,
    stopPublishingAudio,
  ]);

  useEffect(() => {
    if (canSendAudio) {
      setIsAwaitingAudioApproval(false);
    }
  }, [canSendAudio]);

  if (!call || callingState !== CallingState.JOINED) return null;

  const showMuteButton =
    canSendAudio || (canRequestSpeakingPermissions && isSpeaker);

  return (
    <div className="live-room-controls">
      <OpenNotificationsButton
        hasNotifications={hasNotifications}
        openRequestsList={openRequestsList}
      />
      {isAwaitingAudioApproval ? (
        <AwaitingApprovalIndicator />
      ) : showMuteButton ? (
        <ToggleMuteButton
          setIsAwaitingAudioApproval={setIsAwaitingAudioApproval}
        />
      ) : (
        <RequestToSpeakButton
          setIsAwaitingAudioApproval={setIsAwaitingAudioApproval}
        />
      )}
    </div>
  );
};

type AudioRequestApprovalProps = {
  setIsAwaitingAudioApproval: (isAwaiting: boolean) => void;
};

const ToggleMuteButton = ({
  setIsAwaitingAudioApproval,
}: AudioRequestApprovalProps) => {
  const call = useCall();
  const localParticipant = useLocalParticipant();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);

  const { publishAudioStream, stopPublishingAudio, setInitialAudioEnabled } =
    useMediaDevices();

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const toggleAudio = useCallback(async () => {
    if (!call) return;

    if (isAudioMute) {
      if (!canSendAudio) {
        setIsAwaitingAudioApproval(true);
        await call
          .requestPermissions({
            permissions: [OwnCapability.SEND_AUDIO],
          })
          .catch((reason) => {
            console.log('RequestPermissions failed', reason);
          });
        return;
      }

      setInitialAudioEnabled(true);
      await publishAudioStream();
    } else {
      stopPublishingAudio();
    }
  }, [
    call,
    canSendAudio,
    isAudioMute,
    publishAudioStream,
    setInitialAudioEnabled,
    setIsAwaitingAudioApproval,
    stopPublishingAudio,
  ]);

  return (
    <button
      className="icon-button"
      onClick={toggleAudio}
      title={isAudioMute ? 'Unmute' : 'Mute'}
    >
      {isAudioMute ? <MuteMicrophoneIcon /> : <MicrophoneIcon />}
    </button>
  );
};

const RequestToSpeakButton = ({
  setIsAwaitingAudioApproval,
}: AudioRequestApprovalProps) => {
  const call = useCall();
  if (!call) return null;

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]} canRequestOnly>
      <button
        className="icon-button"
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
  );
};

const AwaitingApprovalIndicator = () => (
  <>
    <button className="icon-button" disabled title={'Awaiting approval'}>
      <LoadingIcon />
    </button>
    <div className="live-room-controls__notificaton">
      Waiting for permission to speak
    </div>
  </>
);

const OpenNotificationsButton = ({
  hasNotifications,
  openRequestsList,
}: OpenNotificationsButtonProps) => (
  <Restricted requiredGrants={[OwnCapability.UPDATE_CALL_PERMISSIONS]}>
    <button
      className={`icon-button ${hasNotifications ? 'notifications' : ''}`}
      onClick={openRequestsList}
      title="Requests"
    >
      <BellIcon />
    </button>
  </Restricted>
);
