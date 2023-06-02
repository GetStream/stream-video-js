import {
  useHasPermissions,
  useParticipants,
} from '@stream-io/video-react-bindings';
import {
  getAudioStream,
  OwnCapability,
  PermissionRequestEvent,
  SfuModels,
  StreamCallEvent,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import {} from '@stream-io/video-react-bindings';
import { useEffect, useState } from 'react';
import { useAudioRoomContext } from '../../../contexts/AudioRoomContext/AudioRoomContext';
import RoomOverview from '../RoomOverview';
import {
  AddPersonIcon,
  ChatIcon,
  LeaveIcon,
  MicrophoneButton,
  PersonIcon,
  RaiseHandIcon,
} from '../../icons';
import { useUserContext } from '../../../contexts/UserContext/UserContext';
import SpeakerElement from './SpeakerElement';
import SpeakingRequest from './SpeakingRequest';

const RoomActive = () => {
  const { user } = useUserContext();
  const { currentRoom, leave } = useAudioRoomContext();
  const participants = useParticipants();
  const { stopPublishingAudio } = useMediaDevices();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
  const [speakerIds, setSpeakerIds] = useState<string[]>([]);

  const [speakingRequests, setSpeakingRequests] = useState<
    PermissionRequestEvent[]
  >([]);

  participants.forEach((p) => {
    console.log(`Permissions for ${p.name}: ${p.roles}`);
  });

  // helper variables
  const isCallBackstage = currentRoom?.call?.data?.backstage;
  const hostIds = currentRoom?.hosts?.map((host) => host.id) || [];
  const speakers = participants.filter(
    (p) =>
      p.publishedTracks.includes(SfuModels.TrackType.AUDIO) ||
      hostIds?.includes(p.userId) ||
      speakerIds.includes(p.userId),
  );
  const listeners = participants.filter((p) => !speakers.includes(p));
  const isUserHost =
    currentRoom?.hosts?.some((e) => e.id === user?.id) || false;
  const currentUser = participants.find((p) => p.userId === user?.id);
  const hasAudio = currentUser?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const canRequestSpeakingPermissions =
    currentRoom?.call?.permissionsContext.canRequest(OwnCapability.SEND_AUDIO);

  useEffect(() => {
    const unsubscribe = currentRoom?.call?.on(
      'call.permission_request',
      (event: StreamCallEvent) => {
        const permissionRequest = event as PermissionRequestEvent;

        if (permissionRequest) {
          setSpeakingRequests([...speakingRequests, permissionRequest]);
        }
      },
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = currentRoom?.call?.on(
      'call.ended',
      (event: StreamCallEvent) => {
        leave();
      },
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = currentRoom?.call?.on(
      'call.permissions_updated',
      (event: StreamCallEvent) => {
        const permission_request = event as PermissionRequestEvent;

        if (permission_request) {
          setSpeakerIds([...speakerIds, permission_request.user.id]);
        }
      },
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <section className="active-room">
      <div className="detail-room-list">
        <RoomOverview showAsGrid={false} />
      </div>
      <div className="room-detail">
        <h2>{currentRoom?.title}</h2>
        {isUserHost && speakingRequests.length !== 0 && currentRoom?.call && (
          <div className="speaking-requests-container">
            <h3>Speaking Requests</h3>
            {speakingRequests.map((speakingRequest) => (
              <SpeakingRequest
                key={speakingRequest.user.id}
                call={currentRoom.call}
                speakingRequest={speakingRequest}
                answered={speakingRequestAnswered}
              />
            ))}
          </div>
        )}
        <p className="user-counts secondaryText">
          {participants.length}
          <PersonIcon />/ {speakers.length ?? 0}
          <ChatIcon />
        </p>
        <h3>Speakers ({speakers.length ?? 0})</h3>
        <div className="hosts-grid-detail">
          {speakers.map((speaker) => (
            <SpeakerElement key={speaker.userId} speaker={speaker} />
          ))}
        </div>
        <h3>Listeners ({listeners.length ?? 0})</h3>
        <div className="participants-grid-detail">
          {listeners.map((listener) => (
            <div key={listener.userId}>
              <img src={listener.image} alt={`Profile of ${listener.name}`} />
              <span>{listener.name}</span>
            </div>
          ))}
          <div className="button-list">
            {isCallBackstage && (
              <div>
                <button
                  className="leave-button"
                  onClick={() => backgToOverview()}
                >
                  Back to overview
                </button>
                {isUserHost && (
                  <button
                    className="leave-button"
                    onClick={() => goLiveWithCall()}
                  >
                    Go live!
                  </button>
                )}
              </div>
            )}
            {!isCallBackstage && (
              <>
                <button
                  className="leave-button"
                  onClick={() => endOrLeaveCall()}
                >
                  <LeaveIcon />
                  {isUserHost ? 'End room' : 'Leave Quietly'}
                </button>
                <div>
                  <button className="icon-button">
                    <AddPersonIcon />
                  </button>
                  {canSendAudio && (
                    <button className="icon-button" onClick={() => muteUser()}>
                      <MicrophoneButton />
                    </button>
                  )}
                  {!canSendAudio && canRequestSpeakingPermissions && (
                    <button
                      className="icon-button"
                      onClick={() => requestSpeakingPermission()}
                    >
                      <RaiseHandIcon />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  async function requestSpeakingPermission() {
    const result = await currentRoom?.call?.requestPermissions({
      permissions: [OwnCapability.SEND_AUDIO],
    });
    console.log(
      `Result of call to request speaking permissions was: ${result}`,
    );
  }

  function backgToOverview() {
    leave();
  }

  function speakingRequestAnswered(speakingRequest: PermissionRequestEvent) {
    const newRequests = speakingRequests.filter(
      (r) => r.user.id !== speakingRequest.user.id,
    );
    setSpeakingRequests(newRequests);
  }

  async function goLiveWithCall() {
    const result = await currentRoom?.call?.goLive();
    console.log(`Go live completed with: ${result}`);
  }

  function endOrLeaveCall() {
    if (isUserHost) {
      currentRoom?.call?.endCall();
    }
    leave();
  }

  async function muteUser() {
    if (user?.id) {
      if (hasAudio) {
        console.log('Muting user');
        stopPublishingAudio();
      } else {
        console.log('Unmuting user');
        const audioStream = await getAudioStream();
        await currentRoom?.call?.publishAudioStream(audioStream);
      }
    }
  }
};

export default RoomActive;
