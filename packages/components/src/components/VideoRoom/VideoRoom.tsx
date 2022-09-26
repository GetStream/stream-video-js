import { Credentials } from '@stream-io/video-client';
import { Client, Room, User } from '@stream-io/video-client-sfu';
import { useEffect, useMemo, useState } from 'react';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { CallState } from '@stream-io/video-client-sfu/dist/src/gen/sfu_models/models';
import { Stage } from './Stage';

export type RoomProps = {
  credentials: Credentials;
};

export const VideoRoom = ({ credentials }: RoomProps) => {
  const room = useMemo(() => {
    const user = new User('marcelo', credentials.token);
    const serverUrl =
      /* credentials.server?.url || */ 'http://localhost:3031/twirp';
    const client = new Client(serverUrl, user);
    return new Room(client);
  }, [credentials.server?.url, credentials.token]);

  const [sfuCallState, setSfuCallState] = useState<CallState>();
  const { mediaStream } = useMediaDevices();
  useEffect(() => {
    const joinRoom = async () => {
      // TODO: OL: announce bitrates by passing down MediaStream to .join()
      const callState = await room.join();
      setSfuCallState(callState);
    };

    joinRoom().catch((e) => {
      console.error(`Error happened while joining a room`, e);
      setSfuCallState(undefined);
    });

    return () => {
      room.leave();
    };
  }, [room]);

  useEffect(() => {
    if (mediaStream) {
      room.publish(mediaStream, mediaStream);
    }
  }, [mediaStream, room]);

  return (
    <div className="str-video__video-room">
      {sfuCallState && (
        <Stage participants={sfuCallState.participants} room={room} />
      )}
    </div>
  );
};
