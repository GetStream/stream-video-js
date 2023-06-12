import { useCallMetadata } from '@stream-io/video-react-sdk';
import { CustomCallData } from '../data/audioRoom';

const RoomCard = () => {
  const metadata = useCallMetadata();
  const { title, hosts, description } = (metadata?.custom ||
    {}) as CustomCallData;
  return (
    <div className="room-card">
      <h3>
        {title || 'Unknown title'} {metadata?.ended_at && '(ENDED)'}
      </h3>
      <span>Host(s)</span>
      <div className="hosts-grid">
        {hosts &&
          hosts.map((host, index) => (
            <div key={`${host.id}-${index}`}>
              <img src={host.imageUrl} alt={`Profile of ${host.name}`} />
              <span>{host.name}</span>
            </div>
          ))}
      </div>
      {description && <p>{description}</p>}
    </div>
  );
};

export default RoomCard;
