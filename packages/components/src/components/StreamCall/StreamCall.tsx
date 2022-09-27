import { Credentials } from '@stream-io/video-client';
import { Client, Call, User } from '@stream-io/video-client-sfu';
import { useEffect, useMemo, useState } from 'react';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { CallState } from '@stream-io/video-client-sfu/src/gen/sfu_models/models';
import { Call as ActiveCall } from '@stream-io/video-client';
import { Stage } from './Stage';
import { Stats } from '../Stats';
import { useStreamVideoClient } from '../../StreamVideo';
import { Ping } from '../Ping';

export type RoomProps = {
  currentUser: string;
  activeCall: ActiveCall;
  credentials: Credentials;
};

export const StreamCall = ({
  currentUser,
  credentials,
  activeCall,
}: RoomProps) => {
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

  const videoClient = useStreamVideoClient();
  return (
    <div className="str-video__call">
      {sfuCallState && (
        <>
          <Stage participants={sfuCallState.participants} call={call} />
          <Ping activeCall={activeCall} currentUser={currentUser} />
          {videoClient && (
            <Stats client={videoClient} call={call} activeCall={activeCall} />
          )}
        </>
      )}
    </div>
  );
};
