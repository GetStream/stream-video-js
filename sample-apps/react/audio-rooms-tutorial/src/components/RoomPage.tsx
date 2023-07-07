import {useCallback, useEffect, useState} from 'react';
import {
  Call,
  StreamCall,
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import {RoomUI} from './RoomUI';

type RoomProps = {
  roomId: string;
}

function Room({roomId}: RoomProps) {
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const [call, setCall] = useState<Call | undefined>( );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const loadRoom = useCallback(async () => {
    if (!(client && connectedUser)) return;
    try {
      setLoading(true);
      const newCall = client.call('audio_room', roomId);
      await newCall.getOrCreate({
        data: {
          members: [{ user_id: connectedUser.id, role: 'admin' }],
          custom: {
            title: `${connectedUser.id}'s Room`,
            description: `Room created by ${connectedUser.id}.`,
            hosts: [connectedUser],
          },
        },
      });
      setCall(newCall);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [client, connectedUser]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  if (loading) {
    return <div className="loading-panel">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-panel">
        <h2>Error</h2>
        {error.message}
      </div>
    );
  }

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      <RoomUI loadRoom={loadRoom}/>
    </StreamCall>
  );
}

export default Room;
