import {
  Avatar,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';

export const Listener = ({
  participant: { name, image },
}: {
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;
}) => (
  <div className="listener">
    <Avatar imageSrc={image} name={name} alt={name} />
    <div className="listener-name">{name}</div>
  </div>
);
