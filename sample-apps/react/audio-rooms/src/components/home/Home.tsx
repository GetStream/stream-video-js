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
import UserRow from './UserRow/UserRow';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

const Home = () => {
  const { user } = useUserContext();
  const { state } = useAudioRoomContext();

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
        <UserRow client={client} />
        {state === AudioRoomState.Overview && <RoomOverview />}
        {state === AudioRoomState.Joined && <RoomActiveContainer />}
        {state === AudioRoomState.Create && <RoomForm />}
      </div>
    </StreamVideo>
  );
};

export default Home;
