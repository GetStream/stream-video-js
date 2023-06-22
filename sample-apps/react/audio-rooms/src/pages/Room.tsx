import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { RoomUI } from '../components/Room';
import { useJoinedCall, useUserContext } from '../contexts';
import { LoadingPanel } from '../components/Loading';
import { ErrorPanel } from '../components/Error';
import { generateRoomPayload } from '../utils/generateRoomData';
import { getURLCredentials } from '../utils/getURLCredentials';
import { CALL_TYPE } from '../utils/constants';

function Room() {
  const client = useStreamVideoClient();
  const { joinedCall } = useJoinedCall();
  const { user } = useUserContext();
  const { roomId } = useParams<{ roomId: string }>();
  const [call, setCall] = useState<Call | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const loadRoom = useCallback(
    async (id: string, type: string) => {
      if (!(client && user)) return;
      const newCall = client.call(type, id);
      await newCall.getOrCreate(generateRoomPayload({ user }));
      return newCall;
    },
    [client, user],
  );

  useEffect(() => {
    if (!roomId) return;
    if (roomId === joinedCall?.id) {
      setCall(joinedCall);
      return;
    }
    const urlCredentials = getURLCredentials();
    setLoading(true);
    loadRoom(roomId, urlCredentials.type ?? CALL_TYPE)
      .then(setCall)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [roomId, loadRoom, joinedCall]);

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
