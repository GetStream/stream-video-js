import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  const [params] = useSearchParams({ create: 'false' });
  const [call, setCall] = useState<Call | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const create = params.get('create');
  const loadRoom = useCallback(async () => {
    if (!(client && user && roomId)) return;

    const urlCredentials = getURLCredentials();
    setLoading(true);
    try {
      const newCall = client.call(urlCredentials.type ?? CALL_TYPE, roomId);
      if (create === 'true') {
        const payload = generateRoomPayload({ user });
        await newCall.getOrCreate(payload);
      } else {
        await newCall.get();
      }
      setCall(newCall);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [client, create, roomId, user]);

  useEffect(() => {
    if (roomId && roomId === joinedCall?.id) {
      setCall(joinedCall);
      return;
    }

    loadRoom().catch((e) => {
      console.error('Error loading room', e);
      setError(e as Error);
    });
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
      <RoomUI loadRoom={loadRoom} />
    </StreamCall>
  );
}

export default Room;
