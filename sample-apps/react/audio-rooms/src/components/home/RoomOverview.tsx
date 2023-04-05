import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import RoomCard from './RoomCard';

interface RoomOverviewProps {
  showAsGrid: Boolean;
}

const RoomOverview = ({ showAsGrid = true }: RoomOverviewProps) => {
  const { liveRooms, upcomingRooms, join } = useAudioRoomContext();

  return (
    <section>
      <h2>Live audio rooms</h2>
      <div className={showAsGrid ? 'rooms-grid' : 'rooms-rows'}>
        {liveRooms.map((room) => (
          <button
            key={room.id}
            className="room-card"
            onClick={() => join(room)}
          >
            <RoomCard room={room} />
          </button>
        ))}
      </div>
      <h2>Upcoming audio rooms</h2>
      <div className="rooms-grid">
        {upcomingRooms.map((room) => (
          <button
            key={room.id}
            className="room-card"
            onClick={() => join(room)}
          >
            <RoomCard room={room} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default RoomOverview;
