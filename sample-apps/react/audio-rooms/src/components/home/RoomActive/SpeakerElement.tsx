import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { Audio } from '@stream-io/video-react-sdk';
import { MutedButton, StarIcon } from '../../icons';
import './RoomActive.css';

function SpeakerElement({
  speaker,
}: {
  speaker: StreamVideoParticipant | StreamVideoLocalParticipant;
}): JSX.Element {
  const hasAudio = speaker.publishedTracks.includes(SfuModels.TrackType.AUDIO);
  return (
    <div className="speaker-container">
      <Audio muted={false} audioStream={speaker.audioStream}></Audio>
      <img
        className={`speaker-image ${
          speaker.isSpeaking ? 'speaking-indicator' : ''
        }`}
        src={speaker.image}
        alt={`Profile of ${speaker.name}`}
      />
      {!hasAudio && (
        <div className="mute-icon">
          <MutedButton />
        </div>
      )}
      <p>
        <StarIcon />
        <span>{speaker.name}</span>
      </p>
    </div>
  );
}

export default SpeakerElement;
