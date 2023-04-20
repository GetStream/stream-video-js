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
import { User } from '../../data/users';
import { useEffect } from 'react';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

const Home = ({ userTapped }: { userTapped: User }) => {
  const { user, login, logout } = useUserContext();
  const { state, create } = useAudioRoomContext();

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: user?.token || '',
    user: {
      id: user?.id || '',
    },
  });

  useEffect(() => {
    login(userTapped, client);
  }, []);

  return (
    <StreamVideo client={client}>
      <div className="home-container">
        <section className="home-user-row">
          <div>
            <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
            <h3>@{user?.name}</h3>
          </div>
          <button onClick={() => logout(client)}>Sign out</button>
          <button
            onClick={() => {
              create();
            }}
          >
            + Start room
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
