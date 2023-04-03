import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';
import RoomCard from './RoomCard';

const Home = () => {
  const { user, logout } = useUserContext();
  const { liveRooms, upcomingRooms, join } = useAudioRoomContext();

  return (
    <div>
      <section className="home-user-row">
        <div>
          <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
          <h3>Welcome back, {user?.name}</h3>
        </div>
        <button onClick={() => logout()}>Logout</button>
      </section>
      <h2>Live audio rooms</h2>
      <div className="rooms-grid">
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
    </div>
  );
};

export default Home;
