import { AudioRoom } from '../../data/audioRoom';

const RoomCard = ({ room }: { room: AudioRoom }) => (
  <>
    <h3>{room.title}</h3>
    <span>Host(s)</span>
    <div className="hosts-grid">
      {room.hosts.map((host) => (
        <div key={host.id}>
          <img src={host.imageUrl} alt={`Profile of ${host.name}`} />
          <span>{host.name}</span>
        </div>
      ))}
    </div>
    <p>{room.subtitle}</p>
  </>
);

export default RoomCard;
