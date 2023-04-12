import {
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  AudioRoomState,
  useAudioRoomContext,
} from '../../contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';
import RoomOverview from './RoomOverview';
import RoomActiveContainer from './RoomActive/RoomActiveContainer';
import RoomForm from '../room-form/RoomForm';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

const Home = () => {
  const { user, logout } = useUserContext();
  const { state, create } = useAudioRoomContext();

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: user?.token || '',
    user: {
      id: user?.id || '',
    },
  });

  return (
    <StreamVideo client={client}>
      <div className="home-container">
        <section className="home-user-row">
          <div>
            <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
            <h3>@{user?.name}</h3>
          </div>
          <button onClick={() => logout()}>Sign out</button>
          <button
            onClick={() => {
              create();
            }}
          >
            + Start a room
          </button>
        </section>
        {state === AudioRoomState.Overview && <RoomOverview />}
        {state === AudioRoomState.Joined && <RoomActiveContainer />}
        {state === AudioRoomState.Create && <RoomForm />}
      </div>
    </StreamVideo>
  );
};

export default Home;
