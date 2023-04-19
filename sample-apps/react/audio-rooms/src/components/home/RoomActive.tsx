import { useParticipants } from '@stream-io/video-react-bindings';
import {
  Audio,
  getAudioStream,
  SfuModels,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { useEffect } from 'react';
import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import RoomOverview from './RoomOverview';
import {
  AddPersonIcon,
  ChatIcon,
  LeaveIcon,
  MicrophoneButton,
  PersonIcon,
  RaiseHandIcon,
  StarIcon,
} from '../icons';
import { useUserContext } from '../../contexts/UserContext/UserContext';

const RoomActive = () => {
  const { user } = useUserContext();
  const { currentRoom, leave } = useAudioRoomContext();
  const participants = useParticipants();
  const { stopPublishingAudio } = useMediaDevices();

  useEffect(() => {
    currentRoom?.call?.updateSubscriptionsPartial(
      'video',
      participants.reduce((acc, current) => {
        return {
          ...acc,
          [current.sessionId]: { dimension: { width: 1, height: 1 } },
        };
      }, {}),
    );
  }, []);

  // helper variables
  const speakers = participants.map((p) => p.isSpeaking);
  const isUserHost = currentRoom?.hosts.some((e) => e.id === user?.id);
  const hasAudio = participants.find((p) => p.userId === user?.id)
    ?.publishedTracks[SfuModels.TrackType.AUDIO];

  return (
    <section className="active-room">
      <div className="detail-room-list">
        <RoomOverview showAsGrid={false} />
      </div>
      <div className="room-detail">
        <h2>{currentRoom?.title}</h2>
        <p>Participants: {participants.length}</p>
        {participants.map((participant, index) => (
          <p key={`${participant.userId}-${index}`}>
            <Audio
              muted={participant.isLoggedInUser}
              audioStream={participant.audioStream}
            />
            {participant.name} (Speaking:{' '}
            {participant.isSpeaking ? 'yes' : 'no'})
          </p>
        ))}
        <p className="user-counts secondaryText">
          {participants.length}
          <PersonIcon />/ {speakers.length ?? 0}
          <ChatIcon />
        </p>
        <h3>Hosts ({currentRoom?.hosts.length ?? 0})</h3>
        <div className="hosts-grid-detail">
          {currentRoom?.hosts.map((host) => (
            <div key={host.id}>
              <img src={host.imageUrl} alt={`Profile of ${host.name}`} />
              <p>
                <StarIcon />
                <span>{host.name}</span>
              </p>
            </div>
          ))}
        </div>
        <h3>Listeners ({currentRoom?.listeners.length ?? 0})</h3>
        <div className="participants-grid-detail">
          {currentRoom?.listeners.map((listener) => (
            <div key={listener.id}>
              <img
                src={listener.imageUrl}
                alt={`Profile of ${listener.name}`}
              />
              <span>{listener.name}</span>
            </div>
          ))}
          <div className="button-list">
            <button className="leave-button" onClick={() => endOrLeaveCall()}>
              <LeaveIcon />
              {isUserHost ? 'End room' : 'Leave Quietly'}
            </button>
            <div>
              <button className="icon-button">
                <AddPersonIcon />
              </button>
              {isUserHost && (
                <button className="icon-button" onClick={() => muteUser()}>
                  <MicrophoneButton />
                </button>
              )}
              {!isUserHost && (
                <button className="icon-button">
                  <RaiseHandIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  function endOrLeaveCall() {
    if (isUserHost) {
      currentRoom?.call?.endCall();
    }
    leave();
  }

  async function muteUser() {
    if (user?.id) {
      if (hasAudio) {
        stopPublishingAudio();
      } else {
        const audioStream = await getAudioStream();
        await currentRoom?.call?.publishAudioStream(audioStream);
      }
    }
  }
};

export default RoomActive;
