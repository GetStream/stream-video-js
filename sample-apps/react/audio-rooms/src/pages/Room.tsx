import { StreamCall } from '@stream-io/video-react-sdk';
import { Link, useParams } from 'react-router-dom';
import { RoomUI } from '../components/Room';
import { useLoadedCalls } from '../contexts';

function Room() {
  const { calls } = useLoadedCalls();
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
    <StreamCall call={call}>
      <RoomUI />
    </StreamCall>
  );
}

export default Room;
