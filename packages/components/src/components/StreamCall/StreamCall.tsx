import { Credentials } from '@stream-io/video-client';
import { Client, Call, User } from '@stream-io/video-client-sfu';
import { useEffect, useMemo, useState } from 'react';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { CallState } from '@stream-io/video-client-sfu/dist/src/gen/sfu_models/models';
import { Stage } from './Stage';

export type RoomProps = {
  currentUser: string;
  credentials: Credentials;
};

export const StreamCall = ({ currentUser, credentials }: RoomProps) => {
  const call = useMemo(() => {
    const user = new User(currentUser, credentials.token);
    const serverUrl = credentials.server?.url || 'http://localhost:3031/twirp';
    const client = new Client(serverUrl, user);
    return new Call(client);
  }, [credentials.server?.url, credentials.token, currentUser]);

  const [sfuCallState, setSfuCallState] = useState<CallState>();
  const { mediaStream } = useMediaDevices();
  useEffect(() => {
    const joinCall = async () => {
      // TODO: OL: announce bitrates by passing down MediaStream to .join()
      const callState = await call.join();
      setSfuCallState(callState);
    };

    joinCall().catch((e) => {
      console.error(`Error happened while joining a call`, e);
      setSfuCallState(undefined);
    });

    return () => {
      call.leave();
    };
  }, [call]);

  useEffect(() => {
    if (mediaStream) {
      call.publish(mediaStream, mediaStream);
    }
  }, [mediaStream, call]);

  return (
    <div className="str-video__call">
      {sfuCallState && (
        <Stage participants={sfuCallState.participants} call={call} />
      )}
    </div>
  );
};
