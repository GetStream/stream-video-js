import {
  MediaDevicesProvider,
  StreamCallProvider,
} from '@stream-io/video-react-sdk';
import { Link, useParams } from 'react-router-dom';
import { RoomUI } from '../components/Room';
import { useCalls } from '../contexts';

function Room() {
  const { calls } = useCalls();
  const { roomId } = useParams<{ roomId: string }>();
  const call = calls.find((c) => c.id === roomId);

  if (!call) {
    return (
      <div className="center-column">
        <h2>Could not find the room</h2>
        <Link to="/rooms">Return to rooms overview</Link>
      </div>
    );
  }

  return (
    <StreamCallProvider call={call}>
      <MediaDevicesProvider>
        <RoomUI />
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
}

export default Room;
