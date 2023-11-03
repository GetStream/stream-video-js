import { Avatar, StreamVideoParticipant } from '@stream-io/video-react-sdk';

export const Listener = ({
  participant: { name, image },
}: {
  participant: StreamVideoParticipant;
}) => (
  <div className="listener">
    <Avatar imageSrc={image} name={name} alt={name} />
    <div className="listener-name">{name}</div>
  </div>
);
