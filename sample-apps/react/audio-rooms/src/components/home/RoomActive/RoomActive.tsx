import { useParticipants } from '@stream-io/video-react-bindings';
import {
  getAudioStream,
  OwnCapability,
  SfuModels,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { useEffect } from 'react';
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

const RoomActive = () => {
  const { user } = useUserContext();
  const { currentRoom, leave } = useAudioRoomContext();
  const participants = useParticipants();
  const { stopPublishingAudio } = useMediaDevices();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);

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
  const hostIds = currentRoom?.hosts.map((host) => host.id);
  const speakers = participants.filter(
    (p) => p.audioStream !== undefined || hostIds?.includes(p.userId),
  );
  const listeners = participants.filter((p) => !speakers.includes(p));
  const isUserHost = currentRoom?.hosts.some((e) => e.id === user?.id);
  const currentUser = participants.find((p) => p.userId === user?.id);
  const hasAudio = currentUser?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  return (
    <section className="active-room">
      <div className="detail-room-list">
        <RoomOverview showAsGrid={false} />
      </div>
      <div className="room-detail">
        <h2>{currentRoom?.title}</h2>
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
