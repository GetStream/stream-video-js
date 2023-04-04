import {
  AudioRoomState,
  useAudioRoomContext,
} from '../../contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';
import RoomActive from './RoomActive';
import RoomOverview from './RoomOverview';

const Home = () => {
  const { user, logout } = useUserContext();
  const { state } = useAudioRoomContext();

  return (
    <div>
      <section className="home-user-row">
        <div>
          <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
          <h3>Welcome back, {user?.name}</h3>
        </div>
        <button onClick={() => logout()}>Logout</button>
      </section>
      {state === AudioRoomState.Overview && <RoomOverview />}
      {state === AudioRoomState.Joined && <RoomActive />}
    </div>
  );
};

export default Home;
