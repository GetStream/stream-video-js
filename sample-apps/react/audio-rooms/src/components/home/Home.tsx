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
    <div className="home-container">
      <section className="home-user-row">
        <div>
          <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
          <h3>@{user?.name}</h3>
        </div>
        <button onClick={() => logout()}>Sign out</button>
        <button onClick={() => {}}>+ Start a room</button>
      </section>
      {state === AudioRoomState.Overview && <RoomOverview />}
      {state === AudioRoomState.Joined && <RoomActive />}
    </div>
  );
};

export default Home;
