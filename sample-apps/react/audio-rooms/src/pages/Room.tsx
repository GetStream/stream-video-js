import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { Link, useParams } from 'react-router-dom';
import { RoomUI } from '../components/Room';
import { CALL_TYPE, useJoinedCall } from '../contexts';
import { useCallback, useEffect, useState } from 'react';
import { LoadingPanel } from '../components/Loading';
import { ErrorPanel } from '../components/Error';

function Room() {
  const client = useStreamVideoClient();
  const { joinedCall } = useJoinedCall();
  const { roomId } = useParams<{ roomId: string }>();
  const [call, setCall] = useState<Call | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const loadCall = useCallback(
    async (id: string, type: string = CALL_TYPE) => {
      if (!client) return;
      const newCall = client.call(type, id);
      await newCall.get();
      return newCall;
    },
    [client],
  );

  useEffect(() => {
    if (!roomId) return;
    if (roomId === joinedCall?.id) {
      setCall(joinedCall);
      return;
    }
    setLoading(true);
    loadCall(roomId)
      .then(setCall)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [roomId, loadCall, joinedCall]);

  if (loading) {
    return <LoadingPanel />;
  }

  if (error) {
    return <ErrorPanel error={error} />;
  }

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
