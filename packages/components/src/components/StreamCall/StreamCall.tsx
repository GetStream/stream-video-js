import { ICEServer } from '@stream-io/video-client';
import { Client, Call, User } from '@stream-io/video-client-sfu';
import { useEffect, useMemo, useState } from 'react';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { CallState } from '@stream-io/video-client-sfu/src/gen/sfu_models/models';
import { Stage } from './Stage';
import { Stats } from '../Stats';
import { useStreamVideoClient } from '../../StreamVideo';
import { Ping } from '../Ping';
import { useCall } from '../../hooks/useCall';

export type RoomProps = {
  currentUser: string;
  callId: string;
  callType: string;
  autoJoin?: boolean;
  includeSelf?: boolean;
};

export const StreamCall = ({
  currentUser,
  callId,
  callType,
  autoJoin = true,
  includeSelf = false,
}: RoomProps) => {
  const { activeCall, credentials } = useCall({
    callId,
    callType,
    currentUser,
    autoJoin,
  });

  const call = useMemo(() => {
    if (!credentials) return undefined;
    const user = new User(currentUser, credentials.token);
    const serverUrl = credentials.server?.url || 'http://localhost:3031/twirp';
    const client = new Client(serverUrl, user);
    return new Call(client, {
      connectionConfig:
        toRtcConfiguration(credentials.iceServers) ||
        defaultRtcConfiguration(serverUrl),
    });
  }, [credentials, currentUser]);

  const [sfuCallState, setSfuCallState] = useState<CallState>();
  const { mediaStream } = useMediaDevices();
  useEffect(() => {
    const joinCall = async () => {
      // TODO: OL: announce bitrates by passing down MediaStream to .join()
      const callState = await call?.join();
      setSfuCallState(callState);
    };

    if (activeCall?.createdByUserId === currentUser || autoJoin) {
      // initiator, immediately joins the call
      joinCall().catch((e) => {
        console.error(`Error happened while joining a call`, e);
        setSfuCallState(undefined);
      });
    }

    return () => {
      call?.leave();
    };
  }, [activeCall?.createdByUserId, autoJoin, call, currentUser]);

  useEffect(() => {
    if (mediaStream) {
      call?.publish(mediaStream, mediaStream);
    }
  }, [mediaStream, call]);

  const videoClient = useStreamVideoClient();
  return (
    <div className="str-video__call">
      {sfuCallState && (
        <>
          {call && (
            <Stage
              participants={sfuCallState.participants}
              call={call}
              includeSelf={includeSelf}
              localStream={mediaStream}
              currentUserId={currentUser}
            />
          )}
          {activeCall && (
            <Ping activeCall={activeCall} currentUser={currentUser} />
          )}
          {videoClient && activeCall && call && (
            <Stats client={videoClient} call={call} activeCall={activeCall} />
          )}
        </>
      )}
    </div>
  );
};

const toRtcConfiguration = (config?: ICEServer[]) => {
  if (!config || config.length === 0) return undefined;
  const rtcConfig: RTCConfiguration = {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
  return rtcConfig;
};

const defaultRtcConfiguration = (sfuUrl: string): RTCConfiguration => ({
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: `turn:${hostnameFromUrl(sfuUrl)}:3478`,
      username: 'video',
      credential: 'video',
    },
  ],
});

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return url;
  }
};
