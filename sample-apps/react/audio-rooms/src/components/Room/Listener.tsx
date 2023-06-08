import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';

export const Listener = ({
  participant: { name, image },
}: {
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;
}) => (
  <div className="listener">
    <img src={image} alt={`Profile of ${name}`} />
    <div className="listener-name">{name}</div>
  </div>
);
