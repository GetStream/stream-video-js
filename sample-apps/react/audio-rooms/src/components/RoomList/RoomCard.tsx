import { useCallMetadata } from '@stream-io/video-react-sdk';
import type { CustomCallData, User } from '../../types';

export const RoomCard = () => {
  const metadata = useCallMetadata();
  const { title, hosts, description } = (metadata?.custom ||
    {}) as CustomCallData;
  const backupHost =
    metadata?.created_by &&
    ({
      name: metadata.created_by.name,
      id: metadata.created_by.id,
      imageUrl: metadata.created_by.image,
    } as User);

  return (
    <div className="room-card">
      <h3>
        {title || metadata?.id} {metadata?.ended_at && '(ENDED)'}
      </h3>
      <span>Host(s)</span>
      <div className="hosts-grid">
        {hosts?.length ? (
          hosts.map((host, index) => (
            <Host host={host} key={`${host.id}-${index}`} />
          ))
        ) : backupHost ? (
          <Host host={backupHost} />
        ) : null}
      </div>
      {description && <p>{description}</p>}
    </div>
  );
};

type HostProps = {
  host: User;
};
const Host = ({ host }: HostProps) => (
  <div>
    <img src={host.imageUrl} alt={`Profile of ${host.name}`} />
    <span>{host.name}</span>
  </div>
);
