import { AudioRoom } from '../../data/audioRoom';

const RoomCard = ({ room }: { room: AudioRoom }) => (
  <div className="room-card">
    <h3>{room.title}</h3>
    <span>Host(s)</span>
    <div className="hosts-grid">
      {room.hosts?.map((host, index) => (
        <div key={`${host.id}-${index}`}>
          <img src={host.imageUrl} alt={`Profile of ${host.name}`} />
          <span>{host.name}</span>
        </div>
      ))}
    </div>
    <p>{room.subtitle}</p>
  </div>
);

export default RoomCard;
