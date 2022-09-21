import { Call, Credentials } from '@stream-io/video-client';
import { Client, Room, User } from '@stream-io/video-client-sfu';
import { useEffect, useMemo, useState } from 'react';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { CallState } from '@stream-io/video-client-sfu/dist/src/gen/sfu_models/models';
import { Stage } from './Stage';

export type RoomProps = {
  call: Call;
  credentials: Credentials;
};

export const VideoRoom = ({ call, credentials }: RoomProps) => {
  const room = useMemo(() => {
    const user = new User('marcelo', credentials.token);
    const serverUrl = credentials.server?.url ?? 'http://localhost:3031/twirp';
    const client = new Client(serverUrl, user);
    return new Room(client);
  }, [credentials.token, credentials.server?.url]);

  const [sfuCallState, setSfuCallState] = useState<CallState>();
  const { mediaStream } = useMediaDevices();
  useEffect(() => {
    const joinRoom = async () => {
      const callState = await room.join(mediaStream);
      setSfuCallState(callState);

      room.publish(mediaStream, mediaStream);
    };

    joinRoom().catch((e) => {
      console.error(`Error happened while joining a room`, e);
      setSfuCallState(undefined);
    });

    return () => {
      room.leave();
    };
  }, [room, mediaStream]);

  return (
    <div className="str-video__room">
      {sfuCallState && (
        <Stage participants={sfuCallState.participants} room={room} />
      )}
    </div>
  );
};
